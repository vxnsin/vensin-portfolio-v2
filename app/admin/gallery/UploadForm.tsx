"use client";

import { useActionState } from "react";
import { uploadAction, type ActionState } from "../actions";

export function UploadForm({ tags }: { tags: string[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadAction, null);
  return (
    <form action={action} className="grid gap-3 text-xs sm:grid-cols-2">
      <label className="grid gap-1 sm:col-span-2">
        <span className="text-ink-soft">photo (jpg, png, webp, gif, heic · max 30 MB) or video (mp4, mov, webm · max 200 MB)</span>
        <input name="file" type="file" accept="image/*,.heic,.heif,video/mp4,video/quicktime,video/webm,.mov,.mp4,.webm" required className="input" />
      </label>
      <label className="grid gap-1">
        <span className="text-ink-soft">caption</span>
        <input name="caption" maxLength={120} className="input" placeholder="sunset ride" />
      </label>
      <label className="grid gap-1">
        <span className="text-ink-soft">tag</span>
        <input name="tag" maxLength={30} className="input" placeholder="bike" list="tags" />
        <datalist id="tags">
          {tags.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </label>
      {state?.error && <p className="text-[var(--dnd)] sm:col-span-2">{state.error}</p>}
      {state?.ok && (
        <p className="sm:col-span-2" style={{ color: "var(--ok)" }}>
          uploaded ✓
        </p>
      )}
      <button type="submit" disabled={pending} className="btn w-fit disabled:opacity-60">
        {pending ? "uploading & converting…" : "upload →"}
      </button>
      <p className="text-[10px] text-ink-soft sm:col-span-2">
        photos are converted to webp (max 2200px), heic gets converted automatically. videos are stored as-is: mp4 (h.264) plays everywhere, iphone .mov may not play in every browser.
      </p>
    </form>
  );
}
