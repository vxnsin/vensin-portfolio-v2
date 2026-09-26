// pure helpers, safe to import from client components

/** the seasons a visitor can pick */
export const SEASONS = ["spring", "summer", "autumn", "halloween", "winter"] as const;
/** specials only the calendar (or the admin) can switch on */
export const SPECIALS = ["christmas"] as const;
export const ALL_SEASONS = [...SEASONS, ...SPECIALS] as const;
export type Season = (typeof ALL_SEASONS)[number];
export type SeasonSetting = Season | "auto";

export const SEASON_LABEL: Record<Season, string> = {
  spring: "spring · sakura petals",
  summer: "summer · fireflies",
  autumn: "autumn · falling leaves",
  halloween: "halloween · ghosts and bats",
  winter: "winter · snow",
  christmas: "christmas · santa's sleigh and presents (dec 18–27, not in the visitor picker)",
};

export const SEASON_ICON: Record<Season, string> = { spring: "✿", summer: "☀", autumn: "🍂", halloween: "👻", winter: "❄", christmas: "🎄" };

export function seasonFor(d = new Date()): Season {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (m === 12 && day >= 18 && day <= 27) return "christmas";
  if ((m === 10 && day >= 15) || (m === 11 && day <= 2)) return "halloween";
  if (m >= 9 && m <= 11) return "autumn";
  if (m === 12 || m <= 2) return "winter";
  if (m <= 5) return "spring";
  return "summer";
}

export const isSeason = (s: unknown): s is Season => typeof s === "string" && (ALL_SEASONS as readonly string[]).includes(s);
