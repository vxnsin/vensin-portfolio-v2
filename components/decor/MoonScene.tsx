"use client";

import { useEffect } from "react";

// Type "moon" and the site steps aside: a huge moon filling the top of the sky, two people seen from behind sitting
// on a lit patch of ground, looking up at it. One 64x64 pixel scene as an svg, so it stays crisp at any size.
// The two are nobody in particular, just a couple in the site's colours.

const COL: Record<string, string> = {
  k: "#1b1523", // outline
  H: "#2f2a3d", D: "#d8a97a", Y: "#b0a4ff", W: "#f4f2f6", P: "#2a2d3d", // left: dark hair, skin, lavender jacket, white stripe, trousers
  L: "#f1e4f3", T: "#ff8fb4", S: "#f5e0cf", Q: "#ff8fb4", // right: pale hair, pink tips, skin, pink line on the white top
  M: "#e8eef2", m: "#b7c9d6", r: "#7d9bb0", // moon, its dark patches, rim
  A: "#9fdff0", B: "#3d7d95", C: "#1e3d50", E: "#142b3a", // ground, bright edge to dark
  s: "#f4f1ff", // stars
};

// the two, seen from behind
const LEFT = [
  ".....kkkkkk.....",
  "....kHHHHHHk....",
  "...kHHHHHHHHk...",
  "...kHHHHHHHHk...",
  "...kHHHHHHHHk...",
  "....kHHHHHHk....",
  ".....kDDDDk.....",
  "...kkkYYYYkkk...",
  "..kYYYYYYYYYYk..",
  ".kYYYYWWWWYYYYk.",
  ".kYYYYYYYYYYYYk.",
  ".kYYYYYYYYYYYYk.",
  ".kYYWWWWWWWWYYk.",
  ".kYYYYYYYYYYYYk.",
  ".kYYYYYYYYYYYYk.",
  ".kDkYYYYYYYYkDk.",
  "..kkPPPPPPPPkk..",
  "..kPPPPPPPPPPk..",
  ".kPPPPPPPPPPPPk.",
  ".kkkkkkkkkkkkkk.",
];
const RIGHT = [
  ".....kkkkkk.....",
  "....kLLLLLLk....",
  "...kLLLLLLLLk...",
  "...kLLLLLLLLk...",
  "...kLLLLLLLLk...",
  "...kLLLLLLLLk...",
  "...kTLLLLLLTk...",
  "....kkkSSkkk....",
  "...kkkWWWWkkk...",
  "..kWWWWWWWWWWk..",
  ".kWWWWWQQWWWWWk.",
  ".kWWWWWQQWWWWWk.",
  ".kWWWWWWWWWWWWk.",
  ".kWWWWWWWWWWWWk.",
  ".kSkWWWWWWWWkSk.",
  "..kkPPPPPPPPkk..",
  "..kPPPPPPPPPPk..",
  ".kPPPPPPPPPPPPk.",
  ".kkkkkkkkkkkkkk.",
];

const SIZE = 64;
const MOON_CX = 32;
const MOON_CY = -13;
const MOON_R = 37;
// dark patches on the moon: [x, y, rx, ry] relative to its centre
const MARIA: Array<[number, number, number, number]> = [[-14, 24, 7, 4], [4, 20, 5, 3], [16, 26, 6, 3.5], [-4, 30, 9, 3], [22, 16, 3, 2], [-24, 18, 3, 2.5]];
const GROUND_TOP = 55;
const STARS_PX: Array<[number, number]> = [[4, 30], [11, 38], [20, 33], [27, 44], [40, 36], [47, 42], [56, 31], [60, 46], [8, 48], [52, 50], [34, 29], [15, 27]];
const STARS_PLUS: Array<[number, number]> = [[6, 40], [58, 37], [30, 50]];

const hash = (x: number, y: number) => {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function scene(): Array<[number, number, string]> {
  const out: Array<[number, number, string]> = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - MOON_CX;
      const dy = y - MOON_CY;
      const d = Math.hypot(dx, dy);
      if (d <= MOON_R + 0.5) {
        let c = d > MOON_R - 0.7 ? "r" : "M";
        if (c === "M") for (const [mx, my, rx, ry] of MARIA) if (Math.hypot((dx - mx) / rx, (dy - my) / ry) <= 1) c = "m";
        if (c === "M" && hash(x, y) > 0.93) c = "m"; // a little grain
        out.push([x, y, c]);
      } else if (y >= GROUND_TOP) {
        const depth = y - GROUND_TOP;
        let c = depth === 0 ? "A" : depth < 3 ? "B" : depth < 6 ? "C" : "E";
        if (depth > 0 && hash(x, y) > 0.86) c = depth < 3 ? "A" : "B"; // lit specks
        out.push([x, y, c]);
      }
    }
  }
  for (const [x, y] of STARS_PX) out.push([x, y, "s"]);
  for (const [x, y] of STARS_PLUS) out.push([x, y, "s"], [x - 1, y, "s"], [x + 1, y, "s"], [x, y - 1, "s"], [x, y + 1, "s"]);
  return out;
}
const SCENE = scene();

const LEFT_POS = [14, 38] as const;
const RIGHT_POS = [34, 39] as const;

// fixed "random" stars around the picture so the sky looks the same on every render
const SKY = Array.from({ length: 70 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  return { x: (a - Math.floor(a)) * 100, y: (b - Math.floor(b)) * 100, d: 2 + (i % 3), delay: (i % 7) * 0.4 };
});

export function MoonScene({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-moon", "");
    return () => document.documentElement.removeAttribute("data-moon");
  }, []);
  const cells = (grid: string[], ox: number, oy: number) =>
    grid.flatMap((row, y) => [...row].map((ch, x) => (COL[ch] ? <rect key={`${ox}-${x}-${y}`} x={ox + x} y={oy + y} width={1} height={1} fill={COL[ch]} /> : null)));
  return (
    <div className="moon-scene fixed inset-0 z-[100] grid place-items-center overflow-hidden cursor-pointer" onClick={onClose} role="button" tabIndex={0} aria-label="back to the site">
      {SKY.map((s, i) => (
        <i key={i} className="moon-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.d, height: s.d, animationDelay: `${s.delay}s` }} />
      ))}
      <div className="moon-rise grid gap-4 place-items-center">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} shapeRendering="crispEdges" aria-label="two people sitting under a huge moon" style={{ width: "auto", height: "min(72vh, 480px)", maxWidth: "92vw", border: "3px solid #1b1523", background: "#0d0b16" }}>
          {SCENE.map(([x, y, c]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COL[c]} />
          ))}
          {cells(LEFT, LEFT_POS[0], LEFT_POS[1])}
          {cells(RIGHT, RIGHT_POS[0], RIGHT_POS[1])}
        </svg>
        <div className="text-center text-xs">
          <div className="pixel text-base" style={{ color: "#e9e6da" }}>the moon</div>
          <div className="mt-1" style={{ color: "#8f8aa3" }}>finally. esc or click to come back.</div>
        </div>
      </div>
    </div>
  );
}
