import { createReadStream, createWriteStream, promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { DATA_DIR } from "./db";

// Big uploads arrive in pieces (cloudflare lets at most 100 MB through per request) and are appended to a file under
// .data/incoming, never held in memory. A piece only lands if it starts exactly where the file ends, so a dropped
// connection can simply ask how far it got and carry on from there.

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads"));
const INCOMING = path.join(DATA_DIR, "incoming");
export const MAX_CHUNK_BYTES = 96 * 1024 * 1024;
const STALE_MS = 24 * 60 * 60 * 1000;

const ID = /^[a-z0-9-]{8,64}$/;
export const validId = (id: string | null): id is string => !!id && ID.test(id);
const partFile = (id: string) => path.join(INCOMING, `${id}.part`);

export async function received(id: string): Promise<number> {
  try {
    return (await fs.stat(partFile(id))).size;
  } catch {
    return 0;
  }
}

/** appends one piece; returns the new size, or the current size when `offset` does not match it */
export async function appendChunk(id: string, offset: number, body: ReadableStream<Uint8Array>): Promise<{ ok: boolean; size: number; error?: string }> {
  await fs.mkdir(INCOMING, { recursive: true });
  const have = await received(id);
  if (offset !== have) return { ok: false, size: have, error: "offset mismatch" };
  if (offset === 0) void sweepStale();
  let bytes = 0;
  const guard = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctl) {
      bytes += chunk.byteLength;
      if (bytes > MAX_CHUNK_BYTES) ctl.error(new Error("piece too big"));
      else ctl.enqueue(chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(body.pipeThrough(guard) as import("stream/web").ReadableStream), createWriteStream(partFile(id), { flags: "a" }));
  } catch (e) {
    // cut the file back to where this piece started, so a retry lines up again
    await fs.truncate(partFile(id), have).catch(() => {});
    return { ok: false, size: have, error: e instanceof Error ? e.message : "write failed" };
  }
  return { ok: true, size: have + bytes };
}

export const discard = (id: string) => fs.rm(partFile(id), { force: true });

/** moves the finished file to `dest` (a copy when they sit on different disks) */
export async function finishTo(id: string, dest: string) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  try {
    await fs.rename(partFile(id), dest);
  } catch {
    await pipeline(createReadStream(partFile(id)), createWriteStream(dest));
    await discard(id);
  }
}

export const readPart = (id: string) => fs.readFile(partFile(id));
export const partPath = partFile;

/** uploads that were started and never finished, older than a day */
async function sweepStale() {
  try {
    for (const name of await fs.readdir(INCOMING)) {
      const f = path.join(INCOMING, name);
      const st = await fs.stat(f);
      if (Date.now() - st.mtimeMs > STALE_MS) await fs.rm(f, { force: true });
    }
  } catch {}
}
