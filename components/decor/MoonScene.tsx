"use client";

import { useEffect } from "react";

// Type "moon" and the site steps aside: a night sky, a big pixel moon, and two people sitting on it together.
// One svg, drawn from small grids so it stays crisp at any size. The two are nobody in particular, just a couple
// in the site's colours; the mood is borrowed, the characters are not.

const COL: Record<string, string> = {
  k: "#1b1523", // outline
  M: "#e9e6da", m: "#cfcbbc", c: "#b5b1a3", // moon, its shaded side, craters
  H: "#2f2a3d", D: "#d8a97a", Y: "#b0a4ff", W: "#f4f2f6", K: "#15161c", G: "#ffd76a", P: "#2a2d3d", // left: dark hair, skin, lavender jacket, stripe, shirt, pendant, trousers
  L: "#f1e4f3", T: "#ff8fb4", S: "#f5e0cf", Q: "#ff8fb4", // right: pale hair, pink tips, skin, pink top
};

const LEFT = [
  "...kkkkk..",
  "..kHHHHHk.",
  ".kHHHHHHHk",
  "kHHHHHHHHk",
  "kHDDDDDDHk",
  ".kDkDDkDk.",
  ".kDDDDDDk.",
  "..kDDDDk..",
  "...kDDk...",
  ".kYYkkYYk.",
  "kYYYKGYYYk",
  "kYWYKKYWYk",
  "kDYYKKYYDk",
  ".kPPPPPPk.",
  ".kPPkkPPk.",
  ".kPPk.kPPk",
  ".kPPk.kPPk",
  ".kkkk.kkkk",
];
const RIGHT = [
  "..kkkkkk..",
  ".kLLLLLLk.",
  "kLLLLLLLLk",
  "kLLLLLLLLk",
  "kLLSSSSLLk",
  "kLSkSSkSLk",
  "kLSSSSSSLk",
  "kTkSSSSkTk",
  "..kkSSkk..",
  ".kWWkkWWk.",
  "kWWWQQWWWk",
  "kWWWQQWWWk",
  "kSWWQQWWSk",
  ".kPPPPPPk.",
  ".kPPkkPPk.",
  ".kPPk.kPPk",
  ".kPPk.kPPk",
  ".kkkk.kkkk",
];

const R = 21; // moon radius in cells
const MOON_TOP = 13; // the two sit on the rim, their legs hang in front of it
const CRATERS: Array<[number, number, number]> = [[-9, -6, 3], [7, -10, 2], [10, 4, 4], [-4, 9, 2], [2, -1, 1.5], [-13, 3, 1.5]];

function moonCells(): Array<[number, number, string]> {
  const out: Array<[number, number, string]> = [];
  for (let y = 0; y < 2 * R + 1; y++) {
    for (let x = 0; x < 2 * R + 1; x++) {
      const dx = x - R;
      const dy = y - R;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > R + 0.5) continue;
      // the shaded side is a crescent lit from the top left, not a straight cut
      let c = d > R - 0.6 ? "k" : Math.hypot(dx + 9, dy + 9) > R + 2 ? "m" : "M";
      if (c !== "k") for (const [ox, oy, r] of CRATERS) if (Math.hypot(dx - ox, dy - oy) <= r) c = "c";
      out.push([x, y, c]);
    }
  }
  return out;
}
const MOON = moonCells();

const W = 2 * R + 1;
const H = MOON_TOP + 2 * R + 1;
const LEFT_X = R - 10;
const RIGHT_X = R + 1;

// fixed "random" stars so the sky looks the same on every render
const STARS = Array.from({ length: 70 }, (_, i) => {
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
    grid.flatMap((r, y) => [...r].map((ch, x) => (COL[ch] ? <rect key={`${ox}-${x}-${y}`} x={ox + x} y={oy + y} width={1} height={1} fill={COL[ch]} /> : null)));
  return (
    <div className="moon-scene fixed inset-0 z-[100] grid place-items-center overflow-hidden cursor-pointer" onClick={onClose} role="button" tabIndex={0} aria-label="back to the site">
      {STARS.map((s, i) => (
        <i key={i} className="moon-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.d, height: s.d, animationDelay: `${s.delay}s` }} />
      ))}
      <div className="moon-rise grid gap-4 place-items-center">
        <svg viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" aria-label="two people sitting on the moon" style={{ width: "auto", height: "min(62vh, 336px)", maxWidth: "85vw" }}>
          {MOON.map(([x, y, c]) => (
            <rect key={`${x}-${y}`} x={x} y={y + MOON_TOP} width={1} height={1} fill={COL[c]} />
          ))}
          {cells(LEFT, LEFT_X, 0)}
          {cells(RIGHT, RIGHT_X, 0)}
        </svg>
        <div className="text-center text-xs">
          <div className="pixel text-base" style={{ color: "#e9e6da" }}>the moon</div>
          <div className="mt-1" style={{ color: "#8f8aa3" }}>finally. esc or click to come back.</div>
        </div>
      </div>
    </div>
  );
}
