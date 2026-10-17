"use client";

import { useEffect, useState } from "react";

// Type "moon" and the site steps aside. The scene fills the screen and plays in order: a night sky, a huge moon that
// flies in from the top and settles over everything, a lit patch of ground, and two people seen from behind who sit
// down on it and look up. Sky, moon and ground are pixel art drawn from small grids as svg, so they stay crisp on any
// screen; the two are the sprite at public/moon/couple.png.

const COL: Record<string, string> = {
  // moon: face, dark patches, crater floors, rim, highlight
  M: "#e4f5f3", m: "#9fd3e0", c: "#6fa9bd", r: "#5f94ab", i: "#ffffff",
  // ground, bright edge to dark: the cyan and navy of the sprite that sits on it
  A: "#93e9f6", B: "#4d577a", C: "#2f3752", E: "#1c2033",
};

const hash = (x: number, y: number) => {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/* ---------- the moon: a 121 cell circle with dark patches, craters and a rim ---------- */
const MR = 60;
const MOON_SIZE = 2 * MR + 1;
const MARIA: Array<[number, number, number, number]> = [[-22, -14, 14, 9], [8, -26, 9, 6], [26, -4, 11, 8], [-6, 6, 17, 7], [-34, 12, 8, 6], [14, 22, 12, 6], [36, 20, 5, 4]];
const CRATERS: Array<[number, number, number]> = [[-40, -28, 4], [30, -36, 3], [44, 8, 5], [-14, 30, 3], [4, 40, 4], [-48, 14, 2], [20, 4, 2], [-28, -40, 2], [38, 36, 2]];

function moonCells(): Array<[number, number, string]> {
  const out: Array<[number, number, string]> = [];
  for (let y = 0; y < MOON_SIZE; y++) {
    for (let x = 0; x < MOON_SIZE; x++) {
      const dx = x - MR;
      const dy = y - MR;
      const d = Math.hypot(dx, dy);
      if (d > MR + 0.5) continue;
      let c = d > MR - 1.2 ? "r" : d > MR - 3 ? "m" : "M";
      if (c === "M") {
        for (const [mx, my, rx, ry] of MARIA) if (Math.hypot((dx - mx) / rx, (dy - my) / ry) <= 1) c = "m";
        for (const [cx, cy, cr] of CRATERS) {
          const cd = Math.hypot(dx - cx, dy - cy);
          if (cd <= cr - 1) c = "c";
          else if (cd <= cr) c = dy - cy < 0 ? "c" : "i"; // dark inside, a lit lower rim
        }
        if (c === "M" && hash(x, y) > 0.94) c = "m";
        if (c === "M" && hash(x + 7, y + 3) > 0.985) c = "i";
      }
      out.push([x, y, c]);
    }
  }
  return out;
}
const MOON = moonCells();

/* ---------- the ground: a flat ledge with a bright edge, lit brightest right under the two and fading to the sides ---------- */
const GW = 192;
const GH = 26;
const GROUND_TOP = 6;
function groundCells(): Array<[number, number, string]> {
  const out: Array<[number, number, string]> = [];
  for (let x = 0; x < GW; x++) {
    const centre = 1 - Math.min(1, Math.abs(x - GW / 2) / (GW / 2)); // 1 in the middle, 0 at the edges
    for (let y = GROUND_TOP; y < GH; y++) {
      const depth = y - GROUND_TOP;
      let c = depth === 0 ? "A" : depth < 3 ? "B" : depth < 9 ? "C" : "E";
      // the moonlight pools under the two: more bright specks near the middle, fewer further out and deeper down
      const chance = 0.08 + centre * 0.35 - depth * 0.025;
      if (depth > 0 && hash(x, y) < chance) c = depth < 3 ? "A" : depth < 9 ? "B" : "C";
      out.push([x, y, c]);
    }
  }
  return out;
}
const GROUND = groundCells();

// fixed "random" stars so the sky looks the same on every render
const SKY = Array.from({ length: 90 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  return { x: (a - Math.floor(a)) * 100, y: (b - Math.floor(b)) * 100, d: 1 + (i % 3), delay: (i % 9) * 0.35 };
});

const Cells = ({ cells, dx = 0, dy = 0 }: { cells: Array<[number, number, string]>; dx?: number; dy?: number }) => (
  <>
    {cells.map(([x, y, c]) => (
      <rect key={`${x}-${y}`} x={x + dx} y={y + dy} width={1} height={1} fill={COL[c]} />
    ))}
  </>
);

/** whole-number zoom for a pixel sprite so no row or column gets dropped or doubled unevenly; smooth shrink only if it is too tall */
function fitSprite(img: HTMLImageElement): { width: number; height: number; smooth: boolean } {
  const room = window.innerHeight * 0.5;
  const scale = Math.floor(room / img.naturalHeight);
  if (scale >= 1) return { width: img.naturalWidth * scale, height: img.naturalHeight * scale, smooth: false };
  const f = room / img.naturalHeight;
  return { width: Math.round(img.naturalWidth * f), height: Math.round(room), smooth: true };
}

export function MoonScene({ onClose }: { onClose: () => void }) {
  const [fit, setFit] = useState<{ width: number; height: number; smooth: boolean } | null>(null);
  useEffect(() => {
    document.documentElement.setAttribute("data-moon", "");
    const onResize = () => {
      const img = document.querySelector<HTMLImageElement>(".moon-pair img");
      if (img?.naturalHeight) setFit(fitSprite(img));
    };
    window.addEventListener("resize", onResize);
    return () => {
      document.documentElement.removeAttribute("data-moon");
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return (
    <div className="moon-scene fixed inset-0 z-[100] overflow-hidden cursor-pointer" onClick={onClose} role="button" tabIndex={0} aria-label="back to the site">
      {SKY.map((s, i) => (
        <i key={i} className="moon-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.d, height: s.d, animationDelay: `${s.delay}s` }} />
      ))}
      <i className="moon-shooting" />
      <div className="moon-glow" />
      <svg className="moon-body" viewBox={`0 0 ${MOON_SIZE} ${MOON_SIZE}`} shapeRendering="crispEdges" aria-hidden>
        <Cells cells={MOON} />
      </svg>
      <svg className="moon-ground" viewBox={`0 0 ${GW} ${GH}`} preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges" aria-hidden>
        <Cells cells={GROUND} />
      </svg>
      <div className="moon-pair">
        <i className="moon-shadow" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/moon/couple.png"
          alt="two people sitting on the ground, looking at the moon"
          onLoad={(e) => setFit(fitSprite(e.currentTarget))}
          style={{ imageRendering: fit?.smooth ? "auto" : "pixelated", width: fit?.width, height: fit?.height, display: fit ? "block" : "none" }}
        />
      </div>
      <div className="moon-caption text-center text-xs">
        <div className="pixel text-base" style={{ color: "#e9e6da" }}>the moon</div>
        <div className="mt-1" style={{ color: "#8f8aa3" }}>esc or click to come back</div>
      </div>
    </div>
  );
}
