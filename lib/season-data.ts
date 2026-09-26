// pure helpers, safe to import from client components

/** the seasons a visitor can pick */
export const SEASONS = ["spring", "summer", "autumn", "halloween", "winter"] as const;
/** specials only the calendar (or the admin) can switch on */
export const SPECIALS = ["christmas", "newyear", "birthday", "valentine", "aprilfools"] as const;
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
  newyear: "new year · fireworks (dec 31 – jan 1, not in the visitor picker)",
  birthday: "birthday · confetti and balloons (apr 10, not in the visitor picker)",
  valentine: "valentine's day · hearts (feb 14, not in the visitor picker)",
  aprilfools: "april fools · the site trolls a little (apr 1, not in the visitor picker)",
};

export const SEASON_ICON: Record<Season, string> = { spring: "✿", summer: "☀", autumn: "🍂", halloween: "👻", winter: "❄", christmas: "🎄", newyear: "🎆", birthday: "🎂", valentine: "💌", aprilfools: "🃏" };

export const SEASON_WHEN: Record<Season, string> = {
  spring: "mar 1 – may 31",
  summer: "jun 1 – aug 31",
  autumn: "sep 1 – nov 30 (halloween takes over in between)",
  halloween: "oct 15 – nov 2",
  winter: "dec 1 – feb 28/29 (christmas and new year take over in between)",
  christmas: "dec 18 – 27",
  newyear: "dec 31 – jan 1",
  birthday: "apr 10 (luis' birthday)",
  valentine: "feb 14",
  aprilfools: "apr 1",
};

/** the line under the site title on special days */
export function seasonGreeting(season: Season, d = new Date()): string | null {
  if (season === "christmas") return "merry christmas!";
  if (season === "newyear") return `happy new year ${d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear()}!`;
  if (season === "birthday") return "it's my birthday today!";
  if (season === "valentine") return "happy valentine's day!";
  if (season === "aprilfools") return "happy april fools!";
  return null;
}

export type SeasonNote = { title: string; text: string; link?: { href: string; label: string } };

/** the personal note on the home page for special days */
export function seasonNote(season: Season, d = new Date()): SeasonNote | null {
  const nextYear = d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear();
  switch (season) {
    case "birthday":
      return { title: "wow, today is my birthday!", text: "one year older, same amount of anime. if you want to make my day,", link: { href: "/guestbook", label: "leave a note in the guestbook." } };
    case "christmas":
      return { title: "i wish you a merry christmas!", text: "cozy holidays, warm drinks, and a watchlist you finally have time for. santa is somewhere above the header." };
    case "newyear":
      return { title: `i wish you a happy new year!`, text: `may ${nextYear} bring you good anime, fast builds and zero bugs in production. look up for the fireworks.` };
    case "halloween":
      return { title: "have a spooky day!", text: "the ghosts drifting around are friendly. mostly. the bats have not been asked." };
    case "valentine":
      return { title: "happy valentine's day!", text: "you are loved. yes, even by a website. go tell someone you like them." };
    case "aprilfools":
      return { title: "happy april fools!", text: "nothing on this site is broken today. probably. the title is fine, the buttons are just shy, the calendar is correct and the cookies are real. do not close the update." };
    default:
      return null;
  }
}

export function seasonFor(d = new Date()): Season {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 12 && day === 31) || (m === 1 && day === 1)) return "newyear";
  if (m === 12 && day >= 18 && day <= 27) return "christmas";
  if (m === 4 && day === 10) return "birthday";
  if (m === 4 && day === 1) return "aprilfools";
  if (m === 2 && day === 14) return "valentine";
  if ((m === 10 && day >= 15) || (m === 11 && day <= 2)) return "halloween";
  if (m >= 9 && m <= 11) return "autumn";
  if (m === 12 || m <= 2) return "winter";
  if (m <= 5) return "spring";
  return "summer";
}

export const isSeason = (s: unknown): s is Season => typeof s === "string" && (ALL_SEASONS as readonly string[]).includes(s);
