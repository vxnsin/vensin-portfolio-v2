"use client";

import { useSyncExternalStore } from "react";
import { isSeason, SEASONS, SEASON_ICON as ICON, type Season, type SeasonSetting } from "@/lib/season-data";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season-choice"] });
  return () => obs.disconnect();
}

const getChoice = (): SeasonSetting => {
  const v = document.documentElement.getAttribute("data-season-choice");
  return isSeason(v) ? v : "auto";
};

/** lets a visitor pick the season; "auto" follows the calendar (or the admin's pick). The choice lives in a cookie so the server renders it next time. */
export function SeasonPicker({ fallback }: { fallback: Season }) {
  // null on the server so the value never mismatches during hydration
  const choice = useSyncExternalStore(subscribe, getChoice, () => null);

  const pick = (next: SeasonSetting) => {
    const effective = next === "auto" ? fallback : next;
    const root = document.documentElement;
    root.setAttribute("data-season-choice", next);
    root.setAttribute("data-season", effective); // colours, frames and particles all key off this
    document.cookie = next === "auto" ? "season=; path=/; max-age=0; samesite=lax" : `season=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <label className="btn text-xs cursor-pointer" aria-label="season">
      <select value={choice ?? "auto"} onChange={(e) => pick(e.target.value as SeasonSetting)} className="bg-transparent text-ink cursor-pointer outline-none" disabled={choice === null}>
        <option value="auto">{ICON[fallback]} auto</option>
        {SEASONS.map((s) => (
          <option key={s} value={s}>
            {ICON[s]} {s}
          </option>
        ))}
      </select>
    </label>
  );
}
