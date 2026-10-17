"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FolderOption } from "./FolderForm";

// Pick as many photos and videos as you like, of any size. Each file goes up in pieces of 32 MB (cloudflare allows at
// most 100 MB per request) to /api/admin/upload, one file after another. A failed piece is retried, and the upload
// asks the server how far it got before carrying on, so a hiccup in the connection does not start a video over.
// Everything is sorted by the date it was taken, read from the file on the server.

type Status = "waiting" | "uploading" | "processing" | "done" | "error";
type Row = { name: string; size: number; sent: number; status: Status; error?: string };

const CHUNK = 32 * 1024 * 1024;
const RETRIES = 5;
const IMAGE = /\.(heic|heif|jpe?g|png|webp|gif|avif|tiff?)$/i;
const VIDEO = /\.(mp4|m4v|mov|webm)$/i;
const MAX_IMAGE = 100 * 1024 * 1024;

const size = (n: number) => (n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(2)} GB` : `${(n / 1024 ** 2).toFixed(n < 10 * 1024 ** 2 ? 1 : 0)} MB`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const newId = () => (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`).toLowerCase();

async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...init });
  const json = (await res.json().catch(() => ({}))) as { error?: string; received?: number; ok?: boolean };
  return { res, json };
}

export function UploadForm({ folders, defaultFolder }: { folders: FolderOption[]; defaultFolder?: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [folder, setFolder] = useState(defaultFolder ?? "");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    setFiles(picked);
    setRows(
      picked.map((f) => {
        const video = f.type.startsWith("video/") || VIDEO.test(f.name);
        const image = f.type.startsWith("image/") || IMAGE.test(f.name);
        const error = !video && !image ? "not a photo or video" : image && !video && f.size > MAX_IMAGE ? "pictures max 100 MB" : f.size === 0 ? "empty file" : undefined;
        return { name: f.name, size: f.size, sent: 0, status: error ? "error" : "waiting", error };
      }),
    );
  };

  const set = (i: number, patch: Partial<Row>) => setRows((r) => r.map((row, k) => (k === i ? { ...row, ...patch } : row)));

  /** one file: pieces until everything is there, then "done" so the server processes it */
  const send = async (i: number, file: File) => {
    const id = newId();
    let offset = 0;
    let tries = 0;
    set(i, { status: "uploading", sent: 0 });
    while (offset < file.size) {
      const piece = file.slice(offset, Math.min(file.size, offset + CHUNK));
      try {
        const { res, json } = await api(`/api/admin/upload?id=${id}&offset=${offset}`, { method: "PUT", body: piece, headers: { "content-type": "application/octet-stream" } });
        if (res.status === 401) throw Object.assign(new Error("logged out, log in again"), { fatal: true });
        if (res.ok || res.status === 409) {
          // the server says where the file ends; carry on from there
          offset = typeof json.received === "number" ? json.received : offset + piece.size;
          tries = 0;
          set(i, { sent: offset });
          continue;
        }
        throw new Error(json.error ?? `server said ${res.status}`);
      } catch (e) {
        if ((e as { fatal?: boolean }).fatal || ++tries > RETRIES) {
          await api(`/api/admin/upload?id=${id}`, { method: "DELETE" }).catch(() => {});
          throw e;
        }
        await sleep(1000 * 2 ** tries);
        const check = await api(`/api/admin/upload?id=${id}`).catch(() => null);
        if (check?.res.ok && typeof check.json.received === "number") offset = check.json.received;
      }
    }
    set(i, { status: "processing", sent: file.size });
    const { res, json } = await api(`/api/admin/upload?id=${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: file.name, type: file.type, size: file.size, folder, caption, lastModified: file.lastModified }),
    });
    if (!res.ok) throw new Error(json.error ?? `server said ${res.status}`);
  };

  const start = async () => {
    if (busy || files.length === 0) return;
    setBusy(true);
    for (let i = 0; i < files.length; i++) {
      if (rows[i]?.status === "error" || rows[i]?.status === "done") continue;
      try {
        await send(i, files[i]);
        set(i, { status: "done" });
      } catch (e) {
        set(i, { status: "error", error: e instanceof Error ? e.message : "failed" });
      }
    }
    setBusy(false);
    router.refresh();
  };

  const clear = () => {
    setFiles([]);
    setRows([]);
    if (input.current) input.current.value = "";
  };

  const done = rows.filter((r) => r.status === "done").length;
  const failed = rows.filter((r) => r.status === "error").length;
  const total = rows.reduce((n, r) => n + (r.status === "error" ? 0 : r.size), 0);
  const sent = rows.reduce((n, r) => n + (r.status === "error" ? 0 : r.sent), 0);
  const finished = rows.length > 0 && rows.every((r) => r.status === "done" || r.status === "error");

  return (
    <div className="grid gap-3 text-xs">
      <label className="grid gap-1">
        <span className="text-ink-soft">photos (jpg, png, webp, gif, heic · up to 100 MB each) and videos (mp4, mov, webm · any size). pick as many as you like.</span>
        <input ref={input} type="file" multiple accept="image/*,.heic,.heif,video/mp4,video/quicktime,video/webm,.mov,.mp4,.webm" onChange={(e) => pick(e.target.files)} disabled={busy} className="input" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-ink-soft">folder (for all of them)</span>
          <select value={folder} onChange={(e) => setFolder(e.target.value)} disabled={busy} className="input">
            <option value="">(no folder, top level)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-ink-soft">caption (optional, for all of them; edit single ones below later)</span>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} disabled={busy} className="input" placeholder="sunset ride" />
        </label>
      </div>

      {rows.length > 0 && (
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <div className="progress flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={total ? Math.round((100 * sent) / total) : 0}>
              <i style={{ width: `${total ? (100 * sent) / total : 0}%`, transition: "width .3s" }} />
            </div>
            <span className="text-ink-soft shrink-0">
              {done}/{rows.length} files · {size(sent)} of {size(total)}
              {failed > 0 && ` · ${failed} failed`}
            </span>
          </div>
          <ul className="grid gap-0.5 max-h-64 overflow-y-auto scroll-y border border-dashed border-line p-1.5">
            {rows.map((r, i) => (
              <li key={`${r.name}-${i}`} className="flex items-center gap-2 text-[11px] min-w-0">
                <span className="w-4 shrink-0 text-center" aria-hidden>
                  {r.status === "done" ? "✓" : r.status === "error" ? "✕" : r.status === "uploading" || r.status === "processing" ? <span className="blink">▌</span> : "·"}
                </span>
                <span className="truncate text-ink" style={r.status === "error" ? { color: "var(--dnd)" } : undefined}>
                  {r.name}
                </span>
                <span className="text-ink-soft shrink-0 ml-auto">
                  {r.status === "error"
                    ? r.error
                    : r.status === "uploading"
                      ? `${Math.floor((100 * r.sent) / r.size)}% of ${size(r.size)}`
                      : r.status === "processing"
                        ? "reading date, removing location…"
                        : size(r.size)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={start} disabled={busy || files.length === 0 || finished} className="btn w-fit disabled:opacity-60">
          {busy ? `uploading ${Math.min(done + failed + 1, rows.length)} of ${rows.length}…` : files.length > 1 ? `upload ${files.length} files →` : "upload →"}
        </button>
        {finished && !busy && (
          <button type="button" onClick={clear} className="btn w-fit">
            pick more
          </button>
        )}
        {finished && failed === 0 && <span style={{ color: "var(--ok)" }}>all uploaded ✓</span>}
        {busy && <span className="text-[10px] text-ink-soft">keep this tab open until it is done</span>}
      </div>
      <p className="text-[10px] text-ink-soft">
        everything is sorted by when it was taken (read from the photo or video; the file date if there is none). photos become webp (max 2200px) and lose all metadata, heic gets converted. videos stay as they are, but the location your phone writes into them is removed. mp4 (h.264) plays everywhere, iphone .mov may not play in every browser. big videos take space on the pi: a minute of 4k from an iphone is around 400 MB.
      </p>
    </div>
  );
}
