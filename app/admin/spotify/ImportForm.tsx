"use client";

import { useActionState } from "react";
import { importSpotifyExportAction, type ActionState } from "../actions";

export function ImportForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(importSpotifyExportAction, null);
  return (
    <form action={action} className="grid gap-3 text-xs">
      <ol className="list-decimal pl-4 grid gap-1 text-ink-soft">
        <li>
          spotify → privacy settings →{" "}
          <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noreferrer">
            download your data
          </a>
          . &quot;account data&quot; = last 12 months (a few days), &quot;extended streaming history&quot; = everything ever (up to 30 days).
        </li>
        <li>unzip it and drop the json files here: StreamingHistory_music_*.json or Streaming_History_Audio_*.json. several at once is fine.</li>
      </ol>
      <input name="files" type="file" accept=".json,application/json" multiple required className="input" />
      {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}
      {state?.ok && <p style={{ color: "var(--ok)" }}>imported ✓ {state.error}</p>}
      <button type="submit" disabled={pending} className="btn w-fit disabled:opacity-60">
        {pending ? "importing…" : "import →"}
      </button>
      <p className="text-[10px] text-ink-soft">plays shorter than 30 seconds are ignored. anything after the live import started is skipped, so nothing is counted twice. re-importing the same files changes nothing.</p>
    </form>
  );
}
