// pure helpers, safe to import from client components

export const SEASONS = ["spring", "summer", "autumn", "halloween", "winter"] as const;
export type Season = (typeof SEASONS)[number];
export type SeasonSetting = Season | "auto";

export const SEASON_LABEL: Record<Season, string> = {
  spring: "spring · sakura petals",
  summer: "summer · fireflies",
  autumn: "autumn · falling leaves",
  halloween: "halloween · ghosts and bats",
  winter: "winter · snow",
};

export function seasonFor(d = new Date()): Season {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 10 && day >= 15) || (m === 11 && day <= 2)) return "halloween";
  if (m >= 9 && m <= 11) return "autumn";
  if (m === 12 || m <= 2) return "winter";
  if (m <= 5) return "spring";
  return "summer";
}

export const isSeason = (s: unknown): s is Season => typeof s === "string" && (SEASONS as readonly string[]).includes(s);
