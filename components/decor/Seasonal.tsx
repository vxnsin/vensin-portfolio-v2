"use client";

import { useSyncExternalStore } from "react";
import { isSeason, type Season } from "@/lib/season-data";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });
  return () => obs.disconnect();
}

/** particles for the season on <html data-season>; `initial` is what the server rendered, so the first paint matches */
export function Seasonal({ initial }: { initial: Season }) {
  const season = useSyncExternalStore(
    subscribe,
    () => {
      const v = document.documentElement.getAttribute("data-season");
      return isSeason(v) ? v : initial;
    },
    () => initial,
  );
  return <Particles season={season} />;
}

// Deterministic values so server and client render the same markup.
const seq = (i: number, a: number, b: number) => ((i * a + b) % 100) / 100; // pseudo-random 0..1 per index

const LEAF_COLORS = ["#d9702e", "#b8462f", "#e0a63a", "#8f5a2b"];
const GHOST_COUNT = 5;
const BAT_COUNT = 6;

function Ghost() {
  return (
    <svg viewBox="0 0 16 18" width="26" height="30" aria-hidden shapeRendering="crispEdges">
      <path d="M2 10 Q2 2 8 2 Q14 2 14 10 V17 L12 15 L10 17 L8 15 L6 17 L4 15 L2 17 Z" fill="currentColor" />
      <rect x="5" y="7" width="2" height="3" fill="var(--bg)" />
      <rect x="9" y="7" width="2" height="3" fill="var(--bg)" />
    </svg>
  );
}

function Bat() {
  return (
    <svg viewBox="0 0 16 12" width="28" height="21" aria-hidden>
      <path d="M0 6 Q3 1 6 5 Q7 3 8 5 Q9 3 10 5 Q13 1 16 6 Q13 6 12 10 Q10 7 8 9 Q6 7 4 10 Q3 6 0 6 Z" fill="currentColor" />
    </svg>
  );
}

// santa's sleigh and two reindeer as a pixel grid (k dark, a antler, b brown, r red, w white, f face, g gold)
const REINDEER = [
  "........a.a.a...",
  ".........aaa....",
  "........bbbN....",
  "........bb......",
  "..bbbbbbbbb.....",
  ".bbbbbbbbbb.....",
  ".bbbbbbbbb......",
  ".b..b...b.b.....",
  ".b..b..b...b....",
  "b...b.b.....b...",
];
const SLEIGH = ["......rr....", "......rw....", "......ff....", ".....rrrr...", ".ggrrrrrrrr.", "rrrrrrrrrrrr", ".rrrrrrrrrr.", "..gggggggggg"];
const SCENE = REINDEER.map((row, i) => {
  const sleigh = i >= 2 ? SLEIGH[i - 2] : "............";
  const rope = i === 6 ? "gg" : "..";
  const link = i === 6 ? "g" : ".";
  return sleigh + rope + row.replace("N", "k") + link + row.replace("N", "r");
});
const PIX: Record<string, string> = { k: "#3b2c3a", a: "#c9924f", b: "#8a5a2b", r: "#d9453d", w: "#ffffff", f: "#f2c9a0", g: "#e0b34a" };

function Sleigh() {
  const w = SCENE[0].length;
  const h = SCENE.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w * 3} height={h * 3} className="sleigh" aria-hidden shapeRendering="crispEdges">
      {SCENE.flatMap((row, y) => [...row].map((c, x) => (PIX[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PIX[c]} /> : null)))}
    </svg>
  );
}

const GIFT_COLORS = ["#d9453d", "#2e9d5c", "#4f93d6", "#8e86d9"];
function Gift({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 10 10" width="14" height="14" aria-hidden shapeRendering="crispEdges">
      <rect x="0" y="3" width="10" height="7" fill={color} />
      <rect x="4" y="3" width="2" height="7" fill="#e0b34a" />
      <rect x="0" y="5" width="10" height="2" fill="#e0b34a" />
      <rect x="2" y="1" width="2" height="2" fill="#e0b34a" />
      <rect x="6" y="1" width="2" height="2" fill="#e0b34a" />
      <rect x="4" y="2" width="2" height="1" fill="#e0b34a" />
    </svg>
  );
}

const FIREWORK_COLORS = ["#ffd54a", "#ff6b6b", "#6fd3ea", "#ff8fb4", "#9a8cff", "#8fe36b"];
// a burst is one dot with its sparks drawn as box-shadows, so a single element scales out into a ring
function sparks(r: number, n: number, color: string) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 0 ${color}`;
  }).join(", ");
}

const CONFETTI_COLORS = ["#ff5fa2", "#ffb347", "#2ab7a9", "#9a8cff", "#ffd54a", "#6fd3ea"];
function Balloon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 30" width="22" height="42" aria-hidden>
      <ellipse cx="8" cy="9" rx="7" ry="9" fill={color} />
      <ellipse cx="5.5" cy="6" rx="1.6" ry="2.4" fill="#fff" opacity="0.45" />
      <path d="M6.5 18 L8 20 L9.5 18 Z" fill={color} />
      <path d="M8 20 Q6 24 8 26 Q10 28 8 30" stroke="var(--ink)" strokeWidth="0.8" fill="none" opacity="0.6" />
    </svg>
  );
}

function Cobweb() {
  const rays = [0, 15, 30, 45, 60, 75, 90];
  const rings = [22, 44, 66, 88];
  return (
    <svg viewBox="0 0 100 100" width="150" height="150" className="cobweb" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        {rays.map((a) => (
          <line key={a} x1="0" y1="0" x2={Math.cos((a * Math.PI) / 180) * 100} y2={Math.sin((a * Math.PI) / 180) * 100} />
        ))}
        {rings.map((r) => (
          <path key={r} d={rays.slice(0, -1).map((a, i) => {
            const n = rays[i + 1];
            const x1 = Math.cos((a * Math.PI) / 180) * r, y1 = Math.sin((a * Math.PI) / 180) * r;
            const x2 = Math.cos((n * Math.PI) / 180) * r, y2 = Math.sin((n * Math.PI) / 180) * r;
            const mx = (x1 + x2) / 2 * 0.92, my = (y1 + y2) / 2 * 0.92;
            return `${i === 0 ? `M${x1} ${y1}` : ""} Q${mx} ${my} ${x2} ${y2}`;
          }).join(" ")} />
        ))}
      </g>
    </svg>
  );
}

/** what drifts across the page this season */
function Particles({ season }: { season: Season }) {
  if (season === "spring") {
    return (
      <div className="particles" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className="particle petal"
            style={{ left: `${(i * 37 + 11) % 100}%`, width: 8 + ((i * 5) % 7), height: 8 + ((i * 5) % 7), opacity: 0.25 + ((i * 3) % 5) * 0.06, animationDuration: `${14 + ((i * 7) % 12)}s, ${3 + (i % 4)}s`, animationDelay: `${-((i * 5.3) % 20)}s, ${-((i * 2.6) % 10)}s` }}
          >
            <i style={{ animationDuration: `${4 + (i % 5)}s` }} />
          </span>
        ))}
      </div>
    );
  }

  if (season === "summer") {
    return (
      <div className="particles" aria-hidden>
        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            className="particle firefly"
            style={{ left: `${(i * 29 + 7) % 100}%`, animationDuration: `${18 + ((i * 5) % 14)}s, ${2 + (i % 3)}s`, animationDelay: `${-((i * 4.7) % 24)}s, ${-((i * 1.3) % 4)}s` }}
          >
            <i style={{ animationDuration: `${1.6 + seq(i, 13, 5) * 2.2}s`, animationDelay: `${-seq(i, 7, 3) * 3}s` }} />
          </span>
        ))}
      </div>
    );
  }

  if (season === "autumn") {
    return (
      <div className="particles" aria-hidden>
        {Array.from({ length: 16 }, (_, i) => (
          <span
            key={i}
            className="particle leaf"
            style={{ left: `${(i * 31 + 5) % 100}%`, animationDuration: `${12 + ((i * 7) % 10)}s, ${3 + (i % 4)}s`, animationDelay: `${-((i * 5.1) % 18)}s, ${-((i * 2.2) % 8)}s` }}
          >
            <i style={{ background: LEAF_COLORS[i % LEAF_COLORS.length], width: 10 + ((i * 3) % 6), height: 10 + ((i * 3) % 6), animationDuration: `${3 + (i % 4)}s` }} />
          </span>
        ))}
      </div>
    );
  }

  if (season === "halloween") {
    return (
      <>
        <Cobweb />
        <div className="particles" aria-hidden>
          {Array.from({ length: GHOST_COUNT }, (_, i) => (
            <span
              key={`g${i}`}
              className="particle ghost"
              style={{ left: `${(i * 23 + 9) % 90}%`, animationDuration: `${26 + ((i * 7) % 12)}s, ${4 + (i % 3)}s`, animationDelay: `${-((i * 9.3) % 30)}s, ${-((i * 1.7) % 5)}s` }}
            >
              <i>
                <Ghost />
              </i>
            </span>
          ))}
          {Array.from({ length: BAT_COUNT }, (_, i) => (
            <span
              key={`b${i}`}
              className="particle bat"
              style={{ top: `${18 + ((i * 17) % 55)}%`, animationDuration: `${22 + ((i * 5) % 14)}s, ${3 + (i % 3)}s`, animationDelay: `${-((i * 7.9) % 26)}s, ${-((i * 1.1) % 3)}s` }}
            >
              <i style={{ animationDuration: `${0.35 + seq(i, 11, 3) * 0.25}s` }}>
                <Bat />
              </i>
            </span>
          ))}
        </div>
      </>
    );
  }

  if (season === "christmas") {
    return (
      <>
        <span className="sleigh-track" aria-hidden>
          <i>
            <Sleigh />
          </i>
        </span>
        <div className="particles" aria-hidden>
          {Array.from({ length: 22 }, (_, i) => {
            const size = 3 + ((i * 5) % 3) * 2;
            return (
              <span
                key={`f${i}`}
                className="particle flake"
                style={{ left: `${(i * 23 + 3) % 100}%`, width: size, height: size, opacity: 0.35 + ((i * 3) % 5) * 0.12, animationDuration: `${10 + ((i * 7) % 16)}s, ${3 + (i % 5)}s`, animationDelay: `${-((i * 3.7) % 24)}s, ${-((i * 1.9) % 6)}s` }}
              />
            );
          })}
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={`g${i}`}
              className="particle gift"
              style={{ left: `${(i * 41 + 13) % 100}%`, animationDuration: `${14 + ((i * 5) % 10)}s, ${3 + (i % 3)}s`, animationDelay: `${-((i * 6.1) % 20)}s, ${-((i * 1.4) % 4)}s` }}
            >
              <i style={{ animationDuration: `${5 + (i % 4)}s` }}>
                <Gift color={GIFT_COLORS[i % GIFT_COLORS.length]} />
              </i>
            </span>
          ))}
        </div>
      </>
    );
  }

  if (season === "newyear") {
    return (
      <div className="particles sky" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => {
          const color = FIREWORK_COLORS[i % FIREWORK_COLORS.length];
          const r = 22 + ((i * 7) % 4) * 6;
          return (
            <span key={i} className="firework" style={{ left: `${(i * 37 + 9) % 88 + 4}%`, top: `${(i * 23 + 8) % 36 + 8}%` }}>
              <i style={{ background: color, boxShadow: `${sparks(r, 12, color)}, ${sparks(r * 0.55, 8, color)}`, animationDuration: `${3 + (i % 3) * 0.6}s`, animationDelay: `${-((i * 1.3) % 4)}s` }} />
            </span>
          );
        })}
        {Array.from({ length: 14 }, (_, i) => (
          <span key={`s${i}`} className="particle flake" style={{ left: `${(i * 29 + 5) % 100}%`, width: 3, height: 3, background: "#ffd54a", opacity: 0.6, animationDuration: `${12 + ((i * 7) % 10)}s, ${3 + (i % 4)}s`, animationDelay: `${-((i * 4.1) % 20)}s, ${-((i * 1.7) % 6)}s` }} />
        ))}
      </div>
    );
  }

  if (season === "birthday") {
    return (
      <div className="particles" aria-hidden>
        {Array.from({ length: 30 }, (_, i) => (
          <span key={`c${i}`} className="particle confetti" style={{ left: `${(i * 31 + 7) % 100}%`, animationDuration: `${9 + ((i * 5) % 8)}s, ${2 + (i % 4)}s`, animationDelay: `${-((i * 3.3) % 16)}s, ${-((i * 1.1) % 5)}s` }}>
            <i style={{ background: CONFETTI_COLORS[i % CONFETTI_COLORS.length], animationDuration: `${1.5 + (i % 4) * 0.5}s` }} />
          </span>
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <span key={`b${i}`} className="particle balloon" style={{ left: `${(i * 53 + 11) % 92}%`, animationDuration: `${22 + ((i * 7) % 12)}s, ${4 + (i % 3)}s`, animationDelay: `${-((i * 7.7) % 28)}s, ${-((i * 1.9) % 6)}s` }}>
            <i style={{ animationDuration: `${2.5 + (i % 3) * 0.7}s` }}>
              <Balloon color={CONFETTI_COLORS[(i * 2) % CONFETTI_COLORS.length]} />
            </i>
          </span>
        ))}
      </div>
    );
  }

  // winter
  return (
    <div className="particles" aria-hidden>
      {Array.from({ length: 40 }, (_, i) => {
        const size = 3 + ((i * 5) % 3) * 2;
        return (
          <span
            key={i}
            className="particle flake"
            style={{ left: `${(i * 23 + 3) % 100}%`, width: size, height: size, opacity: 0.35 + ((i * 3) % 5) * 0.12, animationDuration: `${10 + ((i * 7) % 16)}s, ${3 + (i % 5)}s`, animationDelay: `${-((i * 3.7) % 24)}s, ${-((i * 1.9) % 6)}s` }}
          />
        );
      })}
    </div>
  );
}
