// The numbers behind the mochi clicker: what you can buy, what it does, how prestige works, and how a save looks.
// Pure data and math, no browser or database code, so both the page and the tests can use it.

export type Building = { id: string; name: string; blurb: string; cost: number; cps: number };

export const BUILDINGS: Building[] = [
  { id: "hand", name: "spare hand", blurb: "pets mochi while you are busy", cost: 15, cps: 0.1 },
  { id: "yarn", name: "ball of yarn", blurb: "keeps her entertained for hours", cost: 100, cps: 1 },
  { id: "tuna", name: "can of tuna", blurb: "the good stuff, not the cheap one", cost: 1_100, cps: 8 },
  { id: "tree", name: "cat tree", blurb: "three floors, one hammock, zero rules", cost: 12_000, cps: 47 },
  { id: "box", name: "cardboard box", blurb: "if it fits, it produces", cost: 130_000, cps: 260 },
  { id: "laser", name: "laser pointer", blurb: "the red dot is a full-time job now", cost: 1_400_000, cps: 1_400 },
  { id: "catnip", name: "catnip farm", blurb: "entirely legal, mostly", cost: 20_000_000, cps: 7_800 },
  { id: "bakery", name: "mochi bakery", blurb: "she bakes her namesake. it is a lot.", cost: 330_000_000, cps: 44_000 },
  { id: "cafe", name: "cat café", blurb: "customers pay to be ignored", cost: 5_100_000_000, cps: 260_000 },
  { id: "portal", name: "nekoverse portal", blurb: "a door to a world that is only cats", cost: 75_000_000_000, cps: 1_600_000 },
];

export const COST_GROWTH = 1.15;

/** price of the next one when you already own `owned` */
export const buildingCost = (b: Building, owned: number) => Math.ceil(b.cost * Math.pow(COST_GROWTH, owned));

export type Upgrade = { id: string; name: string; blurb: string; cost: number; kind: "building" | "click" | "clickcps"; building?: string; needs?: number; mult?: number; percent?: number };

// every building gets tiers that double it at 1 / 10 / 25 / 50 / 100 owned
const TIERS: Array<{ needs: number; mult: number; suffix: string }> = [
  { needs: 1, mult: 2, suffix: "ii" },
  { needs: 10, mult: 2, suffix: "iii" },
  { needs: 25, mult: 2, suffix: "iv" },
  { needs: 50, mult: 2, suffix: "v" },
  { needs: 100, mult: 2, suffix: "vi" },
];
const TIER_PRICE = [10, 50, 500, 5_000, 50_000];

export const UPGRADES: Upgrade[] = [
  ...BUILDINGS.flatMap((b) =>
    TIERS.map((t, i) => ({
      id: `${b.id}-${i}`,
      name: `${b.name} ${t.suffix}`,
      blurb: `${b.name}s are twice as good`,
      cost: b.cost * TIER_PRICE[i],
      kind: "building" as const,
      building: b.id,
      needs: t.needs,
      mult: t.mult,
    })),
  ),
  { id: "paws-1", name: "softer paws", blurb: "clicks are twice as nice", cost: 100, kind: "click", mult: 2 },
  { id: "paws-2", name: "warm paws", blurb: "clicks are twice as nice again", cost: 5_000, kind: "click", mult: 2 },
  { id: "paws-3", name: "double pats", blurb: "two pats per click, obviously", cost: 500_000, kind: "click", mult: 2 },
  { id: "chin", name: "chin scratch", blurb: "every click also earns 1% of what you make per second", cost: 100_000, kind: "clickcps", percent: 1 },
  { id: "belly", name: "belly rub", blurb: "clicks earn another 1% of your production", cost: 10_000_000, kind: "clickcps", percent: 1 },
  { id: "ears", name: "behind the ears", blurb: "and another 1%. she is very into it.", cost: 1_000_000_000, kind: "clickcps", percent: 1 },
];

export type Achievement = { id: string; name: string; blurb: string; test: (s: Save, cps: number) => boolean };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", name: "hello mochi", blurb: "click her once", test: (s) => s.clicks >= 1 },
  { id: "c100", name: "warm-up", blurb: "click 100 times", test: (s) => s.clicks >= 100 },
  { id: "c1k", name: "carpal tunnel", blurb: "click 1,000 times", test: (s) => s.clicks >= 1_000 },
  { id: "c10k", name: "no thoughts, only mochi", blurb: "click 10,000 times", test: (s) => s.clicks >= 10_000 },
  { id: "e1k", name: "pocket money", blurb: "earn 1,000 mochi", test: (s) => s.earned >= 1_000 },
  { id: "e1m", name: "millionaire", blurb: "earn a million mochi", test: (s) => s.earned >= 1_000_000 },
  { id: "e1b", name: "unreasonable", blurb: "earn a billion mochi", test: (s) => s.earned >= 1_000_000_000 },
  { id: "e1t", name: "why are you still here", blurb: "earn a trillion mochi", test: (s) => s.earned >= 1_000_000_000_000 },
  { id: "cps100", name: "self-sustaining", blurb: "make 100 mochi per second", test: (_s, cps) => cps >= 100 },
  { id: "cps10k", name: "industrial", blurb: "make 10,000 mochi per second", test: (_s, cps) => cps >= 10_000 },
  { id: "cps1m", name: "the economy", blurb: "make a million mochi per second", test: (_s, cps) => cps >= 1_000_000 },
  ...BUILDINGS.map((b) => ({ id: `own-${b.id}`, name: b.name, blurb: `own a ${b.name}`, test: (s: Save) => (s.owned[b.id] ?? 0) >= 1 })),
  { id: "fifty", name: "collector", blurb: "own 50 of one thing", test: (s) => Object.values(s.owned).some((n) => n >= 50) },
  { id: "hundred", name: "hoarder", blurb: "own 100 of one thing", test: (s) => Object.values(s.owned).some((n) => n >= 100) },
  { id: "golden", name: "lucky paw", blurb: "catch a golden mochi", test: (s) => s.goldens >= 1 },
  { id: "golden10", name: "fortune cat", blurb: "catch 10 golden mochi", test: (s) => s.goldens >= 10 },
  { id: "life2", name: "second life", blurb: "use one of her nine lives", test: (s) => s.lives >= 1 },
  { id: "life9", name: "all nine", blurb: "use all nine lives. she has more, do not worry.", test: (s) => s.lives >= 9 },
  { id: "nya", name: "nya", blurb: "click her while she is a catgirl", test: (s) => s.nya },
];

export type Save = {
  v: 1;
  mochi: number; // in the bank
  earned: number; // this life
  lifetime: number; // across all lives, drives prestige
  clicks: number;
  owned: Record<string, number>;
  upgrades: string[];
  achievements: string[];
  whiskers: number; // prestige currency: +5% each
  lives: number; // rebirths so far
  goldens: number;
  nya: boolean;
  savedAt: number;
};

export const emptySave = (): Save => ({ v: 1, mochi: 0, earned: 0, lifetime: 0, clicks: 0, owned: {}, upgrades: [], achievements: [], whiskers: 0, lives: 0, goldens: 0, nya: false, savedAt: Date.now() });

export const WHISKER_BONUS = 0.05; // per whisker
export const ACHIEVEMENT_BONUS = 0.01; // per achievement
export const NYA_BONUS = 0.1; // catgirl form: clicks are 10% nicer

/** how many whiskers `lifetime` mochi is worth in total */
export const whiskersFor = (lifetime: number) => Math.floor(Math.cbrt(Math.max(0, lifetime) / 100_000));
/** mochi you would need for one more whisker */
export const lifetimeForWhiskers = (n: number) => Math.pow(n, 3) * 100_000;

export function globalMultiplier(s: Save) {
  return (1 + s.whiskers * WHISKER_BONUS) * (1 + s.achievements.length * ACHIEVEMENT_BONUS);
}

/** production per second of one building type, upgrades included */
export function buildingCps(s: Save, b: Building) {
  const owned = s.owned[b.id] ?? 0;
  if (!owned) return 0;
  let mult = 1;
  for (const u of UPGRADES) if (u.kind === "building" && u.building === b.id && s.upgrades.includes(u.id)) mult *= u.mult ?? 1;
  return owned * b.cps * mult;
}

export function totalCps(s: Save) {
  let sum = 0;
  for (const b of BUILDINGS) sum += buildingCps(s, b);
  return sum * globalMultiplier(s);
}

/** mochi one click is worth right now */
export function clickValue(s: Save, cps: number, catgirl: boolean) {
  let mult = 1;
  let percent = 0;
  for (const u of UPGRADES) {
    if (!s.upgrades.includes(u.id)) continue;
    if (u.kind === "click") mult *= u.mult ?? 1;
    if (u.kind === "clickcps") percent += u.percent ?? 0;
  }
  const base = (1 * mult + (cps * percent) / 100) * globalMultiplier(s);
  return catgirl ? base * (1 + NYA_BONUS) : base;
}

export const upgradeAvailable = (s: Save, u: Upgrade) => !s.upgrades.includes(u.id) && (u.kind !== "building" || (s.owned[u.building!] ?? 0) >= (u.needs ?? 0));

/* ---------- golden mochi ---------- */

export type GoldenEffect = { kind: "frenzy"; mult: number; seconds: number } | { kind: "lump"; amount: number } | { kind: "clickfrenzy"; mult: number; seconds: number };

/** what a caught golden mochi does; `roll` is 0..1 */
export function goldenEffect(roll: number, cps: number, bank: number): GoldenEffect {
  if (roll < 0.55) return { kind: "frenzy", mult: 7, seconds: 40 };
  if (roll < 0.9) return { kind: "lump", amount: Math.floor(Math.min(cps * 900, bank * 0.15) + 13) };
  return { kind: "clickfrenzy", mult: 777, seconds: 13 };
}

export const GOLDEN_MIN_MS = 60_000;
export const GOLDEN_MAX_MS = 180_000;
export const GOLDEN_LIFETIME_MS = 13_000;
export const OFFLINE_CAP_MS = 2 * 60 * 60 * 1000; // two hours of production while the tab was closed

/* ---------- formatting ---------- */

const SUFFIX = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

/** 1234 → "1,234", 1234567 → "1.23M"; small fractional rates keep one decimal */
export function fmt(n: number, decimals = false): string {
  if (!isFinite(n)) return "∞";
  if (n < 0) return "-" + fmt(-n, decimals);
  if (n < 1_000_000) {
    if (decimals && n < 100) return (Math.round(n * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 1 : 0, maximumFractionDigits: 1 });
    return Math.floor(n).toLocaleString("en-US");
  }
  let i = 0;
  let v = n;
  while (v >= 1000 && i < SUFFIX.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0)}${SUFFIX[i]}`;
}

/** seconds → "1h 02m", "45s" */
export function fmtDuration(sec: number) {
  if (sec < 60) return `${Math.ceil(sec)}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ${String(Math.floor(sec % 60)).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${String(m % 60).padStart(2, "0")}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

/** a save from storage, checked field by field so a broken or older one cannot crash the page */
export function parseSave(raw: unknown): Save | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const num = (k: string) => (typeof r[k] === "number" && isFinite(r[k] as number) && (r[k] as number) >= 0 ? (r[k] as number) : 0);
  const owned: Record<string, number> = {};
  if (r.owned && typeof r.owned === "object") for (const [k, v] of Object.entries(r.owned as Record<string, unknown>)) if (BUILDINGS.some((b) => b.id === k) && typeof v === "number" && v >= 0) owned[k] = Math.floor(v);
  const ids = (k: string, valid: Set<string>) => (Array.isArray(r[k]) ? (r[k] as unknown[]).filter((x): x is string => typeof x === "string" && valid.has(x)) : []);
  return {
    v: 1,
    mochi: num("mochi"),
    earned: num("earned"),
    lifetime: num("lifetime"),
    clicks: Math.floor(num("clicks")),
    owned,
    upgrades: ids("upgrades", new Set(UPGRADES.map((u) => u.id))),
    achievements: ids("achievements", new Set(ACHIEVEMENTS.map((a) => a.id))),
    whiskers: Math.floor(num("whiskers")),
    lives: Math.floor(num("lives")),
    goldens: Math.floor(num("goldens")),
    nya: r.nya === true,
    savedAt: num("savedAt") || Date.now(),
  };
}
