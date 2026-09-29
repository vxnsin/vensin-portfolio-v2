import type { Season } from "@/lib/season-data";

// Mochi, the pixel cat. Grids: k = outline, o = orange fur, w = cream, p = pink, n = note/gold, z = floating "z", h = heart, . = empty.
// Accessories: r = red, v = purple, l = lavender, m = light lavender, b = black, s = scarf red, g = green, y = yellow.
// Catgirl form: e = skin, d = hair shade. Frames are grouped by mood; each frame knows where its head (and, for the
// catgirl, face and neck) is, so a hat or a scarf lands in the right place whatever she looks like right now.

export type Mood = "sleep" | "code" | "music" | "watch" | "idle" | "poke" | "lost";
export type Form = "cat" | "catgirl";
export type Frame = { grid: string[]; head: [number, number]; face?: [number, number]; neck?: [number, number] };

export const PIX: Record<string, string> = {
  k: "#3b2c3a", o: "#e9a552", w: "#fff4e6", p: "#ff8fb4", n: "#ffd54a", h: "#ff5f8a",
  r: "#d9453d", v: "#7d4fd6", l: "#b0a4ff", m: "#d6d0ff", b: "#1a1a1a", s: "#b8462f", g: "#2e9d5c", y: "#ffe066",
  e: "#ffdcc2", d: "#c97f2e",
};

const W = 14;
const pad = (rows: string[]) => rows.map((r) => (r + ".".repeat(W)).slice(0, W));
const row = (base: string[], edits: Record<number, string>) => pad(base.map((r, i) => edits[i] ?? r));
const f = (grid: string[], head: [number, number] = [0, 0]): Frame => ({ grid, head });

// sitting cat, tail to the right; head origin is the top-left of the ear row
const SIT = pad([
  "..k.....k.....",
  ".kok...kok....",
  ".kooooooook...",
  ".kokoooookk...",
  ".koooowoook...",
  "..koooooook...",
  "..kkkkkkkk....",
  ".koooooooook..",
  ".kooooooookk.k",
  ".koookoookkkok",
  "..kk..kk...kk.",
]);
const SIT_BLINK = row(SIT, { 3: ".kooooooook..." });
const SIT_TAIL_UP = row(SIT, { 7: ".koooooooook.k", 8: ".kooooooookkkk", 9: ".koookoookkk..", 10: "..kk..kk......" });
const SIT_STRETCH = pad([
  "..............",
  "..............",
  "..k.....k.....",
  ".kok...kok....",
  ".kooooooook...",
  ".kokoooookk...",
  ".koooowoook...",
  "..kkoooookkkkk",
  ".koooooooooook",
  ".kooooooooook.",
  "..kk.kk.kkkk..",
]);

// sleeping: curled up in a loaf, head on the left with closed eyes, tail wrapped around the front, a z that drifts up.
// head origin is the ear row; the neck anchor sits where the head meets the body so a scarf lands there and not on the belly
const SLEEP_BASE = pad([
  "..............",
  "..............",
  "..............",
  "..k.....k.....",
  ".kok...kok....",
  ".kooooooook...",
  ".kokkookkokkk.",
  ".koooowooooook",
  "kooooooooooook",
  "kooddddddddook",
  ".kkkkkkkkkkkk.",
]);
// breathing: the back rises by one pixel
const SLEEP_BREATHE = row(SLEEP_BASE, { 5: ".kooooooookkk.", 6: ".kokkookkoooook" });
const SLEEP_Z1 = row(SLEEP_BASE, { 2: "..........z..." });
const SLEEP_Z2 = row(SLEEP_BREATHE, { 1: "...........z..", 2: "..........z..." });
const SLEEP_Z3 = row(SLEEP_BASE, { 0: "............z.", 1: "...........z.." });

const CODE_A = row(SIT, { 9: ".koookookkkkok", 10: "..kk...kk..kk." });
const CODE_B = row(SIT, { 9: ".kkkookookkkok", 10: "...kk..kk..kk." });
const CODE_C = row(SIT, { 3: ".kooooooook...", 9: ".koookookkkkok", 10: "..kk...kk..kk." });

const MUSIC_A = row(SIT, { 0: "..k.....k.n...", 1: ".kok...kokn..." });
const MUSIC_B = pad(["..............", ...SIT.slice(0, 10)].map((r, i) => (i === 1 ? ".nk.....k....." : r)));
const MUSIC_C = row(SIT, { 0: "..k.....k..n..", 1: ".kok...kok.n.." });

const WATCH_A = row(SIT, { 3: ".kokkooookkk..", 4: ".kokwoooowok.." });
const WATCH_B = row(SIT, { 3: ".kkkoooookkk..", 4: ".kwkoooowkok.." });
const WATCH_C = row(WATCH_A, { 2: "kooooooook....", 3: "kokkooookkk...", 4: "kokwoooowok..." });

const POKE_A = row(SIT, { 0: "..k..h..k.....", 3: ".kokoooookk...", 4: ".kooooooook..." });
const POKE_B = row(SIT, { 0: ".hk.....kh....", 1: ".kok...kok..h.", 3: ".kkkooookkk...", 4: ".koooooooook.." });
const POKE_C = row(SIT, { 0: "h.k.....k...h.", 3: ".kkkooookkk...", 4: ".koooooooook.." });

const LOST_A = row(SIT, { 3: ".kokoooookk..?", 4: ".koooowoook..." });
const LOST_B = row(SIT, { 3: ".kkoooookok...", 4: ".kooowooook..." });
const LOST_C = row(SIT, { 3: ".kokoooookk...", 4: ".koooowoook..." });

const sleep = (grid: string[]): Frame => ({ grid, head: [0, 3], neck: [0, 2] });
export const FRAMES: Record<Mood, Frame[]> = {
  idle: [f(SIT), f(SIT), f(SIT_TAIL_UP), f(SIT), f(SIT_BLINK), f(SIT), f(SIT_TAIL_UP), f(SIT_STRETCH, [0, 2]), f(SIT_STRETCH, [0, 2]), f(SIT)],
  sleep: [sleep(SLEEP_BASE), sleep(SLEEP_Z1), sleep(SLEEP_BREATHE), sleep(SLEEP_Z2), sleep(SLEEP_BASE), sleep(SLEEP_Z3), sleep(SLEEP_BREATHE), sleep(SLEEP_BASE)],
  code: [f(CODE_A), f(CODE_B), f(CODE_A), f(CODE_B), f(CODE_C), f(CODE_B)],
  music: [f(MUSIC_A), f(MUSIC_B, [0, 1]), f(MUSIC_C), f(MUSIC_B, [0, 1])],
  watch: [f(WATCH_A), f(WATCH_A), f(WATCH_B), f(WATCH_A), f(WATCH_C, [-1, 0]), f(WATCH_C, [-1, 0])],
  poke: [f(POKE_A), f(POKE_B), f(POKE_C), f(POKE_B)],
  lost: [f(LOST_A), f(LOST_A), f(LOST_B), f(LOST_B), f(LOST_C), f(LOST_A)],
};

export const FRAME_MS: Record<Mood, number> = { idle: 500, sleep: 700, code: 220, music: 380, watch: 600, poke: 260, lost: 550 };

export const CAPTION: Record<Mood, string> = {
  idle: "waiting for something to happen",
  sleep: "zzz. luis is away, so is the cat.",
  code: "supervising the code",
  music: "bopping along",
  watch: "watching too, apparently",
  poke: "purr.",
  lost: "also has no idea where that page went",
};

/* ---------- catgirl form: same moods, a taller sprite. head origin is the ear row, face two rows lower, neck at the collar ---------- */

const GIRL = pad([
  "..k.......k...",
  ".kok.....kok..",
  ".kooooooooook.",
  ".kooooooooook.",
  ".koeeeeeeeeok.",
  ".koewheewheok.",
  ".koehheehheok.",
  ".kopeekkeepok.",
  ".kooeeeeeeook.",
  ".kokkkkkkkkok.",
  ".kd.kppppk.dk.",
  ".kdkppppppkdkk",
  "..kkpppppppkko",
  "...kppppppppko",
  "...kkkkkkkkkkk",
  "....kek..kek..",
  "....kkk..kkk..",
]);
const g = (grid: string[]): Frame => ({ grid, head: [1, 0], face: [1, 2], neck: [1, 4] });
const GIRL_BLINK = row(GIRL, { 5: ".koeeeeeeeeok.", 6: ".koekkeekkeok." });
const GIRL_TAIL = row(GIRL, { 11: ".kdkppppppkdk.", 12: "..kkpppppppkkk", 13: "...kppppppppko", 14: "...kkkkkkkkkko", 15: "....kek..kekk." });
const GIRL_WAVE = row(GIRL, { 9: ".kokkkkkkkkokk", 10: ".kd.kppppk.dke", 11: ".kdkppppppkdkk" });
const GIRL_SLEEP_A = row(GIRL_BLINK, { 0: "..k.......k.z." });
const GIRL_SLEEP_B = row(GIRL_BLINK, { 0: "..k.......k..z", 1: ".kok.....kokz." });
const GIRL_CODE_A = row(GIRL, { 5: ".koeeeeeeeeok.", 6: ".koehheehheok.", 12: "..kkpepppepkko" });
const GIRL_CODE_B = row(GIRL, { 5: ".koeeeeeeeeok.", 6: ".koehheehheok.", 12: "..kkppeppeppko" });
const GIRL_MUSIC_A = row(GIRL, { 0: "..k.......k.n.", 1: ".kok.....kokn." });
const GIRL_MUSIC_B = row(GIRL_TAIL, { 0: "n.k.......k...", 1: "nkok.....kok.." });
const GIRL_WATCH = row(GIRL, { 5: ".koewneewneok.", 6: ".koenneenneok." });
const GIRL_POKE_A = row(GIRL, { 0: "..k..h....k...", 7: ".koppekkeppok." });
const GIRL_POKE_B = row(GIRL, { 0: "h.k.......k.h.", 1: ".kok.....kok.h", 5: ".koeeeeeeeeok.", 6: ".koewweewweok.", 7: ".koppekkeppok." });
const GIRL_LOST_A = row(GIRL, { 0: "..k.......k..?" });
const GIRL_LOST_B = row(GIRL, { 5: ".koeewheewheok", 6: ".koeehheehheok" });

export const GIRL_FRAMES: Record<Mood, Frame[]> = {
  idle: [g(GIRL), g(GIRL), g(GIRL_TAIL), g(GIRL), g(GIRL_BLINK), g(GIRL), g(GIRL_TAIL), g(GIRL_WAVE), g(GIRL_WAVE), g(GIRL)],
  sleep: [g(GIRL_BLINK), g(GIRL_SLEEP_A), g(GIRL_BLINK), g(GIRL_SLEEP_B), g(GIRL_BLINK), g(GIRL_SLEEP_A)],
  code: [g(GIRL_CODE_A), g(GIRL_CODE_B), g(GIRL_CODE_A), g(GIRL_CODE_B), g(GIRL_BLINK), g(GIRL_CODE_B)],
  music: [g(GIRL_MUSIC_A), g(GIRL_TAIL), g(GIRL_MUSIC_B), g(GIRL)],
  watch: [g(GIRL_WATCH), g(GIRL_WATCH), g(GIRL_WATCH), g(GIRL_BLINK), g(GIRL_WATCH), g(GIRL_WATCH)],
  poke: [g(GIRL_POKE_A), g(GIRL_POKE_B), g(GIRL_POKE_A), g(GIRL_POKE_B)],
  lost: [g(GIRL_LOST_A), g(GIRL_LOST_A), g(GIRL_LOST_B), g(GIRL_LOST_B), g(GIRL), g(GIRL_LOST_A)],
};

export const GIRL_CAPTION: Record<Mood, string> = {
  idle: "nya~ waiting for something to happen",
  sleep: "nyzz… luis is away, so is the catgirl.",
  code: "pair programming, nya",
  music: "dancing along, nya",
  watch: "watching anime, obviously",
  poke: "nyaa~!",
  lost: "nya? that page was here a second ago",
};

export const framesFor = (form: Form): Record<Mood, Frame[]> => (form === "catgirl" ? GIRL_FRAMES : FRAMES);
export const captionFor = (form: Form): Record<Mood, string> => (form === "catgirl" ? GIRL_CAPTION : CAPTION);

/* ---------- seasonal accessories, drawn over the frame relative to the head origin (row 0 = ear row, negative = above) ---------- */

type Accessory = { anchor?: "face" | "neck"; rows: Array<[number, string]> }; // [row relative to the anchor, 14-wide pattern]
const TOP = 5; // rows of room above the head for hats

const SANTA: Accessory = { rows: [[-3, "........ww...."], [-2, "......rrr....."], [-1, ".....rrrrr...."], [0, "..rrrrrrrr...."], [1, ".wwwwwwwwww..."]] };
const WITCH: Accessory = { rows: [[-4, "......k......."], [-3, ".....kkk......"], [-2, "....kkkkk....."], [-1, "....kkkkk....."], [0, "...vvvvvvv...."], [1, "kkkkkkkkkkkk.."]] };
const BEANIE: Accessory = { rows: [[-3, "......ww......"], [-2, "....llllll...."], [-1, "...llllllll..."], [0, "..llllllllll.."], [1, ".mmmmmmmmmm..."]] };
const SCARF: Accessory = { anchor: "neck", rows: [[6, ".ssssssssss..."], [7, "...ss.........."], [8, "...ss.........."]] };
const PARTY_GOLD: Accessory = { rows: [[-4, "......p......."], [-3, "......n......."], [-2, ".....pnp......"], [-1, ".....nnn......"], [0, "....pnpnp....."], [1, "....nnnnn....."]] };
const PARTY_PINK: Accessory = { rows: [[-4, "......y......."], [-3, "......p......."], [-2, ".....ypy......"], [-1, ".....ppp......"], [0, "....ypypy....."], [1, "....ppppp....."]] };
const CONFETTI: Accessory = { rows: [[-3, "n............p"], [-1, ".............y"], [2, "p............."], [5, ".............n"]] };
const SUNGLASSES: Accessory = { anchor: "face", rows: [[3, "..bbbbbbbbb..."], [4, "..bbb...bbb..."]] };
const FLOWER: Accessory = { rows: [[0, ".p.p.........."], [1, "..p..........."], [2, ".p.p.........."]] };
const HEART: Accessory = { rows: [[-2, "...........h.h"], [-1, "...........hhh"], [0, "............h."]] };
const GROUCHO: Accessory = { anchor: "face", rows: [[3, "..bbb.b.bbb..."], [4, "..b.b...b.b..."], [5, "...bbbbbb....."]] };
const HOLLY: Accessory = { rows: [[1, "..........gg.."], [2, ".........ggr.."]] };

export const ACCESSORIES: Partial<Record<Season, Accessory[]>> = {
  spring: [FLOWER],
  summer: [SUNGLASSES],
  autumn: [SCARF],
  halloween: [WITCH],
  winter: [BEANIE, SCARF],
  christmas: [SANTA, HOLLY],
  newyear: [PARTY_GOLD, CONFETTI],
  birthday: [PARTY_PINK, CONFETTI],
  valentine: [HEART],
  aprilfools: [GROUCHO],
};

/** the frame plus this season's accessories, composed onto one canvas with room above the head */
export function compose(frame: Frame, season: Season | null): string[] {
  const rows = TOP + frame.grid.length;
  const canvas: string[][] = Array.from({ length: rows }, () => Array(W).fill("."));
  frame.grid.forEach((r, y) => [...r].forEach((c, x) => { if (c !== ".") canvas[y + TOP][x] = c; }));
  for (const acc of (season && ACCESSORIES[season]) ?? []) {
    const [dx, dy] = (acc.anchor === "face" ? frame.face : acc.anchor === "neck" ? frame.neck : undefined) ?? frame.head;
    for (const [rel, pattern] of acc.rows) {
      const y = TOP + dy + rel;
      if (y < 0 || y >= rows) continue;
      [...pattern].forEach((c, i) => {
        const x = i + dx;
        if (c !== "." && x >= 0 && x < W) canvas[y][x] = c;
      });
    }
  }
  return canvas.map((r) => r.join(""));
}

/** renders one frame as crisp pixel rects; "z" and "?" are drawn as tiny text */
export function Sprite({ frame, season = null, scale = 5, className }: { frame: Frame; season?: Season | null; scale?: number; className?: string }) {
  const grid = compose(frame, season);
  const h = grid.length;
  return (
    <svg viewBox={`0 0 ${W} ${h}`} width={W * scale} height={h * scale} shapeRendering="crispEdges" aria-hidden className={className}>
      {grid.flatMap((r, y) =>
        [...r].map((c, x) => {
          if (c === "z" || c === "?") {
            return (
              <text key={`${x}-${y}`} x={x} y={y + 1} fontSize="1.5" fill="var(--ink-soft)" fontFamily="var(--font-pixel)">
                {c}
              </text>
            );
          }
          return PIX[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PIX[c]} /> : null;
        }),
      )}
    </svg>
  );
}
