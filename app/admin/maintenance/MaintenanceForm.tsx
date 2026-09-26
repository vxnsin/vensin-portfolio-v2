"use client";

import { useActionState } from "react";
import { setMaintenanceAction, type ActionState } from "../actions";
import { Window } from "@/components/layout/Window";

export function MaintenanceForm({ on, message, since }: { on: boolean; message: string; since: string | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setMaintenanceAction, null);

  return (
    <div className="grid gap-4 text-xs">
      <div className="flex items-center gap-2">
        <span className="status-dot" style={{ background: on ? "var(--dnd)" : "var(--ok)", borderWidth: 0 }} />
        <span className="pixel text-sm">{on ? "maintenance mode is ON" : "site is live"}</span>
        {on && since && <span className="text-ink-soft">since {new Date(since).toLocaleString("de-DE")}</span>}
      </div>
      <p className="text-ink-soft">
        while maintenance is on, every visitor gets a standalone &quot;under maintenance&quot; page with a 503 status (search engines keep the old index). you keep seeing
        the real site as long as you are logged in here.{" "}
        <a href="/api/maintenance" target="_blank" rel="noreferrer">
          preview the page ↗
        </a>
      </p>

      <form action={action} className="grid gap-3">
        <Window title="message on the maintenance page" dashed>
          <input name="message" defaultValue={message} maxLength={200} className="input" />
        </Window>
        <Window title="confirm with your admin password" dashed>
          <input name="password" type="password" required autoComplete="current-password" className="input" placeholder="password" />
        </Window>
        {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}
        {state?.ok && <p style={{ color: "var(--ok)" }}>saved ✓</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" name="on" value={on ? "0" : "1"} disabled={pending} className="btn disabled:opacity-60" style={on ? undefined : { color: "var(--dnd)" }}>
            {pending ? "…" : on ? "turn maintenance OFF" : "turn maintenance ON"}
          </button>
          <button type="submit" name="on" value={on ? "1" : "0"} disabled={pending} className="btn text-[11px] disabled:opacity-60">
            save message only
          </button>
        </div>
      </form>
    </div>
  );
}
