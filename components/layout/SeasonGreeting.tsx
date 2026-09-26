"use client";

import { useSyncExternalStore } from "react";
import { isSeason, seasonGreeting, SEASON_ICON, type Season } from "@/lib/season-data";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });
  return () => obs.disconnect();
}

/** one line under the title on special days (christmas, new year, birthday); follows <html data-season> like the particles do */
export function SeasonGreeting({ initial }: { initial: Season }) {
  const season = useSyncExternalStore(
    subscribe,
    () => {
      const v = document.documentElement.getAttribute("data-season");
      return isSeason(v) ? v : initial;
    },
    () => initial,
  );
  const text = seasonGreeting(season);
  if (!text) return null;
  return (
    <div className="pixel text-accent text-sm mt-1">
      {SEASON_ICON[season]} {text} {SEASON_ICON[season]}
    </div>
  );
}
