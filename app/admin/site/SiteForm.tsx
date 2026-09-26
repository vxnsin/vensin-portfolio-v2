"use client";

import { useActionState } from "react";
import { saveSiteAction, type ActionState } from "../actions";
import { Window } from "@/components/layout/Window";

export function SiteForm({ marquee }: { marquee: string[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSiteAction, null);
  return (
    <form action={action} className="grid gap-4 text-xs">
      <Window title="marquee (one line per entry)" dashed>
        <textarea name="marquee" rows={12} defaultValue={marquee.join("\n")} className="input font-mono" />
      </Window>
      {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}
      {state?.ok && <p style={{ color: "var(--ok)" }}>saved ✓</p>}
      <button type="submit" disabled={pending} className="btn w-fit disabled:opacity-60">
        {pending ? "saving…" : "save →"}
      </button>
    </form>
  );
}
