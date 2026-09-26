"use client";

import { useActionState } from "react";
import { uploadAction, type ActionState } from "../actions";

export function UploadForm({ tags }: { tags: string[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadAction, null);
  return (
    <form action={action} className="grid gap-3 text-xs sm:grid-cols-2">
      <label className="grid gap-1 sm:col-span-2">
        <span className="text-ink-soft">image (max 8 MB)</span>
        <input name="file" type="file" accept="image/*" required className="input" />
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
      {state?.ok && <p className="sm:col-span-2" style={{ color: "var(--ok)" }}>uploaded ✓</p>}
      <button type="submit" disabled={pending} className="btn w-fit disabled:opacity-60">
        {pending ? "uploading…" : "upload →"}
      </button>
    </form>
  );
}
