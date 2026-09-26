"use client";

import { useActionState } from "react";
import { saveSiteAction, type ActionState } from "../actions";
import type { NowBox } from "@/lib/store";
import { Window } from "@/components/layout/Window";

export function SiteForm({ marquee, now }: { marquee: string[]; now: NowBox }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSiteAction, null);
  return (
    <form action={action} className="grid gap-4 text-xs">
      <Window title="marquee (one line per entry)" dashed>
        <textarea name="marquee" rows={10} defaultValue={marquee.join("\n")} className="input font-mono" />
      </Window>

      <Window title="now box fallbacks (discord overrides these live)" dashed>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["watching", "playing", "listening", "mood"] as const).map((k) => (
            <label key={k} className="grid gap-1">
              <span className="text-ink-soft">{k}</span>
              <input name={k} maxLength={80} defaultValue={now[k]} className="input" />
            </label>
          ))}
        </div>
      </Window>

      {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}
      {state?.ok && <p style={{ color: "var(--ok)" }}>saved ✓</p>}
      <button type="submit" disabled={pending} className="btn w-fit disabled:opacity-60">
        {pending ? "saving…" : "save →"}
      </button>
    </form>
  );
}
