import { spawn, spawnSync } from "child_process";
import { existsSync, promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { getDb } from "./db";
import { UPLOAD_DIR } from "./upload";

// Videos from a phone are huge (4k, 50 Mbit/s, often hevc): a home connection cannot stream that through the tunnel.
// So every uploaded video gets, in the background and one at a time:
//   a still  (<name>.poster.webp) for tiles, folder covers and the player before it starts
//   a web copy (<name>.web.mp4): h.264, at most 1920px and 30 fps, ~8 Mbit/s, starts playing right away
// The original stays and can be downloaded. Needs ffmpeg on the server (`sudo apt install ffmpeg` on the pi);
// without it everything still works, just without stills and web copies.

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";
const WEB_MAX = 1920;
const MAX_RUN_MS = 3 * 60 * 60 * 1000;

let available: boolean | null = null;
let checkedAt = 0;

/** is ffmpeg installed? checked again every ten minutes, so installing it later just works */
export function ffmpegAvailable(): boolean {
  if (available !== null && (available || Date.now() - checkedAt < 10 * 60 * 1000)) return available;
  checkedAt = Date.now();
  try {
    available = spawnSync(FFMPEG, ["-version"], { timeout: 5000 }).status === 0 && spawnSync(FFPROBE, ["-version"], { timeout: 5000 }).status === 0;
  } catch {
    available = false;
  }
  return available;
}

/** runs a tool at the lowest priority so the site stays quick while a video converts */
function run(cmd: string, args: string[], opts: { stdout?: boolean } = {}): Promise<{ code: number; out: Buffer; err: string }> {
  const lowPriority = process.platform !== "win32" && existsSync("/usr/bin/nice");
  const child = lowPriority ? spawn("/usr/bin/nice", ["-n", "19", cmd, ...args]) : spawn(cmd, args, { windowsHide: true });
  const out: Buffer[] = [];
  let err = "";
  child.stdout.on("data", (d: Buffer) => opts.stdout !== false && out.push(d));
  child.stderr.on("data", (d: Buffer) => {
    err = (err + d.toString()).slice(-4000);
  });
  const timer = setTimeout(() => child.kill("SIGKILL"), MAX_RUN_MS);
  return new Promise((resolve) => {
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ code: -1, out: Buffer.alloc(0), err: String(e) });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, out: Buffer.concat(out), err });
    });
  });
}

export type VideoProbe = { codec: string; width: number; height: number; duration: number; bitrate: number; fps: number };

export async function probe(file: string): Promise<VideoProbe | null> {
  const r = await run(FFPROBE, ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", file]);
  if (r.code !== 0) return null;
  try {
    const j = JSON.parse(r.out.toString()) as { streams?: Array<Record<string, unknown>>; format?: Record<string, unknown> };
    const v = j.streams?.find((s) => s.codec_type === "video");
    if (!v) return null;
    const [n, d] = String(v.avg_frame_rate ?? v.r_frame_rate ?? "0/1").split("/").map(Number);
    return {
      codec: String(v.codec_name ?? ""),
      width: Number(v.width) || 0,
      height: Number(v.height) || 0,
      duration: Number(j.format?.duration) || 0,
      bitrate: Number(j.format?.bit_rate) || 0,
      fps: d ? n / d : 0,
    };
  } catch {
    return null;
  }
}

/** a still from a second in (or the middle of a short clip), as a 720px webp */
async function makePoster(src: string, dest: string, p: VideoProbe | null) {
  const at = p && p.duration > 0 ? Math.min(1, p.duration / 2) : 0;
  const r = await run(FFMPEG, ["-v", "error", "-ss", at.toFixed(2), "-i", src, "-frames:v", "1", "-vf", "scale='min(720,iw)':-2", "-f", "image2pipe", "-vcodec", "png", "-"]);
  if (r.code !== 0 || !r.out.length) throw new Error(`still failed: ${r.err.split("\n").filter(Boolean).pop() ?? r.code}`);
  await fs.writeFile(dest, await sharp(r.out).webp({ quality: 78 }).toBuffer());
}

/** already fine for the web: h.264, small enough, not too heavy */
const webReady = (p: VideoProbe) => p.codec === "h264" && Math.max(p.width, p.height) <= WEB_MAX && (p.bitrate === 0 || p.bitrate <= 12_000_000) && p.fps <= 61;

async function makeWebCopy(src: string, dest: string, p: VideoProbe) {
  const tmp = `${dest}.part`;
  const copyOnly = webReady(p);
  const args = copyOnly
    ? // right codec, wrong box (a .mov): just repack with the index up front so it starts playing at once
      ["-v", "error", "-y", "-i", src, "-map", "0:v:0", "-map", "0:a:0?", "-map_metadata", "-1", "-map_chapters", "-1", "-c", "copy", "-movflags", "+faststart", "-f", "mp4", tmp]
    : [
        "-v", "error", "-y", "-i", src,
        "-map", "0:v:0", "-map", "0:a:0?", "-map_metadata", "-1", "-map_chapters", "-1", // nothing from the phone, location included
        "-vf", `scale='min(${WEB_MAX},iw)':'min(${WEB_MAX},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,format=yuv420p`,
        "-fpsmax", "30",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-maxrate", "8M", "-bufsize", "16M", "-profile:v", "high",
        "-c:a", "aac", "-b:a", "128k", "-ac", "2",
        "-movflags", "+faststart", "-threads", "3", "-f", "mp4", tmp,
      ];
  const r = await run(FFMPEG, args, { stdout: false });
  if (r.code !== 0) {
    await fs.rm(tmp, { force: true });
    throw new Error(`conversion failed: ${r.err.split("\n").filter(Boolean).pop() ?? r.code}`);
  }
  await fs.rename(tmp, dest);
}

/* ---------- the queue ---------- */

type Row = { id: string; url: string; poster: string | null; web_status: string | null };
const db = () => getDb();
const setRow = (id: string, fields: Partial<{ poster: string | null; web_url: string | null; web_status: string }>) => {
  const keys = Object.keys(fields);
  if (!keys.length) return;
  db()
    .prepare(`update gallery set ${keys.map((k) => `${k} = ?`).join(", ")} where id = ?`)
    .run(...keys.map((k) => fields[k as keyof typeof fields] ?? null), id);
};

/** the files that belong to an upload besides itself (still and web copy), for deleting */
export function derivedFiles(url: string): string[] {
  if (!url.startsWith("/uploads/")) return [];
  const base = path.join(UPLOAD_DIR, path.basename(url));
  return [`${base}.poster.webp`, `${base}.web.mp4`, `${base}.web.mp4.part`];
}

let working = false;
let resetDone = false;
let current: string | null = null;

export const videoQueueState = () => ({ ffmpeg: available, working, current });

/** starts working through the videos that still need a still or a web copy, unless it is already busy */
export function kickVideoQueue() {
  if (working) return;
  void work();
}

async function work() {
  working = true;
  try {
    if (!resetDone) {
      // a restart in the middle of a conversion: try that one again
      db().prepare("update gallery set web_status = 'pending' where web_status = 'working'").run();
      resetDone = true;
    }
    if (!ffmpegAvailable()) {
      db().prepare("update gallery set web_status = 'no-ffmpeg' where kind = 'video' and (web_status is null or web_status = 'pending')").run();
      return;
    }
    db().prepare("update gallery set web_status = 'pending' where web_status = 'no-ffmpeg'").run();
    for (;;) {
      const row = db().prepare("select id, url, poster, web_status from gallery where kind = 'video' and (web_status is null or web_status = 'pending') order by created_at limit 1").get() as Row | undefined;
      if (!row) break;
      current = row.id;
      await processOne(row);
    }
  } catch (e) {
    console.error("[video] queue stopped:", e);
  } finally {
    working = false;
    current = null;
  }
}

async function processOne(row: Row) {
  if (!row.url.startsWith("/uploads/")) return setRow(row.id, { web_status: "skipped" }); // stored elsewhere (blob)
  const src = path.join(UPLOAD_DIR, path.basename(row.url));
  if (!existsSync(src)) return setRow(row.id, { web_status: "failed" });
  setRow(row.id, { web_status: "working" });
  const [posterFile, webFile] = derivedFiles(row.url);
  const still = () => db().prepare("select 1 from gallery where id = ?").get(row.id);
  try {
    const p = await probe(src);
    if (!row.poster) {
      // a missing still is no reason to skip the web copy
      try {
        await makePoster(src, posterFile, p);
        if (!still()) return void (await fs.rm(posterFile, { force: true }));
        setRow(row.id, { poster: `${row.url}.poster.webp` });
      } catch (e) {
        console.error(`[video] ${row.url}:`, e instanceof Error ? e.message : e);
      }
    }
    // an mp4 that is already right needs no copy at all
    if (p && webReady(p) && path.extname(src).toLowerCase() === ".mp4") return setRow(row.id, { web_status: "skipped" });
    if (!p) return setRow(row.id, { web_status: "failed" });
    await makeWebCopy(src, webFile, p);
    if (!still()) return void (await fs.rm(webFile, { force: true }));
    setRow(row.id, { web_url: `${row.url}.web.mp4`, web_status: "done" });
  } catch (e) {
    console.error(`[video] ${row.url}:`, e instanceof Error ? e.message : e);
    if (still()) setRow(row.id, { web_status: "failed" });
  }
}
