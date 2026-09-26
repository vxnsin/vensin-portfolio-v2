import { cookies, headers } from "next/headers";
import { kvGet, kvSet } from "./db";
import { isSeason, seasonFor, SPECIALS, type Season, type SeasonSetting } from "./season-data";

// The site dresses up for the time of year: colours, the frame of the windows and what drifts across the page.
export * from "./season-data";

export function getSeasonSetting(): SeasonSetting {
  const v = kvGet<string>("season", "auto");
  return isSeason(v) ? v : "auto";
}

export function setSeasonSetting(s: SeasonSetting) {
  kvSet("season", s);
}

/** what this request shows: an admin preview (?season=, forwarded by the proxy) beats the visitor's cookie, which beats the site default */
export async function resolveSeason(): Promise<{ season: Season; choice: SeasonSetting; fallback: Season; locked: boolean }> {
  const fallback = currentSeason();
  // on a special day the site wears the special, full stop: the visitor's pick is ignored and the picker is disabled
  const locked = (SPECIALS as readonly string[]).includes(fallback);
  const preview = (await headers()).get("x-season-preview");
  if (isSeason(preview)) return { season: preview, choice: "auto", fallback, locked: (SPECIALS as readonly string[]).includes(preview) };
  if (locked) return { season: fallback, choice: "auto", fallback, locked };
  const picked = (await cookies()).get("season")?.value;
  const choice: SeasonSetting = isSeason(picked) ? picked : "auto";
  return { season: choice === "auto" ? fallback : choice, choice, fallback, locked };
}

/** the season the site shows right now: the admin override, otherwise the calendar */
export function currentSeason(): Season {
  const setting = getSeasonSetting();
  return setting === "auto" ? seasonFor() : setting;
}
