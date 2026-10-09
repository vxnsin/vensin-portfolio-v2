"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadAction } from "../actions";
import type { FolderOption } from "./FolderForm";

// Pick as many photos and videos as you like; they go up one after another (one request per file, so a few big
// videos do not hit the size limit together). Each one is sorted by the date it was taken, read from the file.

type Status = "waiting" | "uploading" | "done" | "error";
type Row = { name: string; size: number; status: Status; error?: string };

const VIDEO = /\.(mp4|m4v|mov|webm)$/i;
const MAX_IMAGE = 30 * 1024 * 1024;
const MAX_VIDEO = 200 * 1024 * 1024;
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;

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
        const tooBig = f.size > (video ? MAX_VIDEO : MAX_IMAGE);
        return { name: f.name, size: f.size, status: tooBig ? "error" : "waiting", error: tooBig ? (video ? "over 200 MB" : "over 30 MB") : undefined };
      }),
    );
  };

  const set = (i: number, patch: Partial<Row>) => setRows((r) => r.map((row, k) => (k === i ? { ...row, ...patch } : row)));

  const start = async () => {
    if (busy || files.length === 0) return;
    setBusy(true);
    for (let i = 0; i < files.length; i++) {
      if (rows[i]?.status === "error" || rows[i]?.status === "done") continue;
      set(i, { status: "uploading" });
      const fd = new FormData();
      fd.set("file", files[i]);
      fd.set("folder", folder);
      fd.set("caption", caption);
      fd.set("lastModified", String(files[i].lastModified));
      try {
        const res = await uploadAction(null, fd);
        set(i, res?.ok ? { status: "done" } : { status: "error", error: res?.error ?? "failed" });
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
  const finished = rows.length > 0 && rows.every((r) => r.status === "done" || r.status === "error");

  return (
    <div className="grid gap-3 text-xs">
      <label className="grid gap-1">
        <span className="text-ink-soft">photos (jpg, png, webp, gif, heic · max 30 MB each) and videos (mp4, mov, webm · max 200 MB each). pick as many as you like.</span>
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
            <div className="progress flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={done}>
              <i style={{ width: `${(100 * (done + failed)) / rows.length}%` }} />
            </div>
            <span className="text-ink-soft shrink-0">
              {done}/{rows.length}
              {failed > 0 && ` · ${failed} failed`}
            </span>
          </div>
          <ul className="grid gap-0.5 max-h-56 overflow-y-auto scroll-y border border-dashed border-line p-1.5">
            {rows.map((r, i) => (
              <li key={`${r.name}-${i}`} className="flex items-center gap-2 text-[11px] min-w-0">
                <span className="w-4 shrink-0 text-center" aria-hidden>
                  {r.status === "done" ? "✓" : r.status === "error" ? "✕" : r.status === "uploading" ? <span className="blink">▌</span> : "·"}
                </span>
                <span className={`truncate ${r.status === "error" ? "" : "text-ink"}`} style={r.status === "error" ? { color: "var(--dnd)" } : undefined}>
                  {r.name}
                </span>
                <span className="text-ink-soft shrink-0 ml-auto">{r.error ?? mb(r.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button type="button" onClick={start} disabled={busy || files.length === 0 || finished} className="btn w-fit disabled:opacity-60">
          {busy ? `uploading ${done + failed + 1} of ${rows.length}…` : files.length > 1 ? `upload ${files.length} files →` : "upload →"}
        </button>
        {finished && !busy && (
          <button type="button" onClick={clear} className="btn w-fit">
            pick more
          </button>
        )}
        {finished && failed === 0 && <span style={{ color: "var(--ok)" }}>all uploaded ✓</span>}
      </div>
      <p className="text-[10px] text-ink-soft">
        everything is sorted by when it was taken (read from the photo or video; the file date if there is none). photos become webp (max 2200px) and lose all metadata, heic gets converted. videos stay as they are, but the location your phone writes into them is removed. mp4 (h.264) plays everywhere, iphone .mov may not play in every browser.
      </p>
    </div>
  );
}
