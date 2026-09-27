// Mochi, the pixel cat. Grids: k = outline, o = orange fur, w = cream, p = pink, n = note, z = a floating "z", h = heart, . = empty.
// Frames are grouped by mood; each mood loops through its frames.

export type Mood = "sleep" | "code" | "music" | "watch" | "idle" | "poke" | "lost";

export const PIX: Record<string, string> = { k: "#3b2c3a", o: "#e9a552", w: "#fff4e6", p: "#ff8fb4", n: "#ffd54a", h: "#ff5f8a" };

const W = 14;
const pad = (rows: string[]) => rows.map((r) => (r + ".".repeat(W)).slice(0, W));

// sitting cat, tail to the right
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
const row = (base: string[], edits: Record<number, string>) => pad(base.map((r, i) => edits[i] ?? r));

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

// sleeping: curled up, breathing, a z that drifts up
const SLEEP_BASE = pad([
  "..............",
  "..............",
  "..............",
  "...k.....k....",
  "..kok...kok...",
  "..kooooooook..",
  "..kkoooookkk..",
  ".kooooooooook.",
  "koooooooooooo.",
  "kooooooooook..",
  ".kkkkkkkkkk...",
]);
const SLEEP_BREATHE = row(SLEEP_BASE, { 6: "..kkoooookkk..", 7: ".koooooooooook", 8: "kooooooooooook", 9: ".kooooooooook." });
const SLEEP_Z1 = row(SLEEP_BASE, { 2: "..........z...", });
const SLEEP_Z2 = row(SLEEP_BREATHE, { 1: "...........z..", 2: "..........z..." });
const SLEEP_Z3 = row(SLEEP_BASE, { 0: "............z.", 1: "...........z.." });

// coding: paws tapping
const CODE_A = row(SIT, { 9: ".koookookkkkok", 10: "..kk...kk..kk." });
const CODE_B = row(SIT, { 9: ".kkkookookkkok", 10: "...kk..kk..kk." });
const CODE_C = row(SIT, { 3: ".kooooooook...", 9: ".koookookkkkok", 10: "..kk...kk..kk." });

// music: head bob and a note
const MUSIC_A = row(SIT, { 0: "..k.....k.n...", 1: ".kok...kokn..." });
const MUSIC_B = pad(["..............", ...SIT.slice(0, 10)].map((r, i) => (i === 1 ? ".nk.....k....." : r)));
const MUSIC_C = row(SIT, { 0: "..k.....k..n..", 1: ".kok...kok.n.." });

// watching: wide eyes, occasional lean forward
const WATCH_A = row(SIT, { 3: ".kokkooookkk..", 4: ".kokwoooowok.." });
const WATCH_B = row(SIT, { 3: ".kkkoooookkk..", 4: ".kwkoooowkok.." });
const WATCH_C = row(WATCH_A, { 2: "kooooooook....", 3: "kokkooookkk...", 4: "kokwoooowok..." });

// poked: hearts and a happy squint
const POKE_A = row(SIT, { 0: "..k..h..k.....", 3: ".kokoooookk...", 4: ".kooooooook..." });
const POKE_B = row(SIT, { 0: ".hk.....kh....", 1: ".kok...kok..h.", 3: ".kkkooookkk...", 4: ".koooooooook.." });
const POKE_C = row(SIT, { 0: "h.k.....k...h.", 3: ".kkkooookkk...", 4: ".koooooooook.." });

// lost (404): looking around, question mark
const LOST_A = row(SIT, { 3: ".kokoooookk..?", 4: ".koooowoook..." });
const LOST_B = row(SIT, { 3: ".kkoooookok...", 4: ".kooowooook..." });
const LOST_C = row(SIT, { 3: ".kokoooookk...", 4: ".koooowoook..." });

export const FRAMES: Record<Mood, string[][]> = {
  idle: [SIT, SIT, SIT_TAIL_UP, SIT, SIT_BLINK, SIT, SIT_TAIL_UP, SIT_STRETCH, SIT_STRETCH, SIT],
  sleep: [SLEEP_BASE, SLEEP_Z1, SLEEP_BREATHE, SLEEP_Z2, SLEEP_BASE, SLEEP_Z3, SLEEP_BREATHE, SLEEP_BASE],
  code: [CODE_A, CODE_B, CODE_A, CODE_B, CODE_C, CODE_B],
  music: [MUSIC_A, MUSIC_B, MUSIC_C, MUSIC_B],
  watch: [WATCH_A, WATCH_A, WATCH_B, WATCH_A, WATCH_C, WATCH_C],
  poke: [POKE_A, POKE_B, POKE_C, POKE_B],
  lost: [LOST_A, LOST_A, LOST_B, LOST_B, LOST_C, LOST_A],
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

/** renders one frame as crisp pixel rects; "z" and "?" are drawn as tiny text */
export function Sprite({ grid, scale = 5 }: { grid: string[]; scale?: number }) {
  const h = grid.length;
  const w = grid[0].length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w * scale} height={h * scale} shapeRendering="crispEdges" aria-hidden>
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
