import { kvGet, kvSet } from "./db";
import { isSeason, seasonFor, type Season, type SeasonSetting } from "./season-data";

// The site dresses up for the time of year: colours, the frame of the windows and what drifts across the page.
export * from "./season-data";

export function getSeasonSetting(): SeasonSetting {
  const v = kvGet<string>("season", "auto");
  return isSeason(v) ? v : "auto";
}

export function setSeasonSetting(s: SeasonSetting) {
  kvSet("season", s);
}

/** the season the site shows right now: the admin override, otherwise the calendar */
export function currentSeason(): Season {
  const setting = getSeasonSetting();
  return setting === "auto" ? seasonFor() : setting;
}
