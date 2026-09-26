"use client";

import { useActionState } from "react";
import { saveSiteAction, type ActionState } from "../actions";
import { Window } from "@/components/layout/Window";
import { ALL_SEASONS, SEASON_LABEL, type Season, type SeasonSetting } from "@/lib/season-data";

export function SiteForm({ marquee, season, calendar }: { marquee: string[]; season: SeasonSetting; calendar: Season }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSiteAction, null);
  return (
    <form action={action} className="grid gap-4 text-xs">
      <Window title="marquee (one line per entry)" dashed>
        <textarea name="marquee" rows={12} defaultValue={marquee.join("\n")} className="input font-mono" />
      </Window>
      <Window title="season" dashed>
        <div className="grid gap-2">
          <p className="text-ink-soft">
            the site&apos;s default season. visitors can pick their own in the footer, this is what everyone else gets. &quot;auto&quot; follows the calendar: spring mar–may, summer jun–aug, autumn sep–nov with halloween from oct 15 to nov 2, winter dec–feb, and christmas from dec 18 to 27 (santa flies, presents fall; visitors can&apos;t pick it themselves). right now the calendar says <b>{calendar}</b>.
          </p>
          <select name="season" defaultValue={season} className="input w-fit">
            <option value="auto">auto (calendar)</option>
            {ALL_SEASONS.map((s) => (
              <option key={s} value={s}>
                {SEASON_LABEL[s]}
              </option>
            ))}
          </select>
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
