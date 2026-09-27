"use client";

import { useEffect, useState } from "react";
import { useLanyardContext } from "@/components/discord/LanyardProvider";
import { resolveAll } from "@/components/discord/activities";

// A pixel cat that lives in the sidebar and reacts to the discord status: sleeps when idle or offline, taps away
// while coding, bops to music, watches with big eyes during anime, and purrs when you poke it.
// Frames are tiny grids: k = dark outline/ink, o = orange fur, w = white, p = pink, . = empty.

type Mood = "sleep" | "code" | "music" | "watch" | "idle" | "poke";

const PIX: Record<string, string> = { k: "#3b2c3a", o: "#e9a552", w: "#fff4e6", p: "#ff8fb4", n: "#ffd54a" };

const IDLE_A = [
  "..k.....k...",
  ".kok...kok..",
  ".kooooooook.",
  ".kokoooookk.",
  ".koooowoook.",
  "..koooooook.",
  "..kkkkkkkk..",
  ".koooooooook",
  ".kooooooookk",
  ".koookoookk.",
  "..kk..kk....",
];
const IDLE_B = IDLE_A.map((r, i) => (i === 3 ? ".kooooooook." : r)); // blink
const SLEEP_A = [
  "............",
  "............",
  "............",
  "..k.....k...",
  ".kok...kok..",
  ".kooooooook.",
  ".kkoooookkk.",
  ".koooooooook",
  "kooooooooook",
  "koooooooook.",
  ".kkkkkkkkk..",
];
const SLEEP_B = SLEEP_A.map((r, i) => (i === 2 ? ".........z.." : i === 1 ? "..........z." : r));
const CODE_A = IDLE_A.map((r, i) => (i === 9 ? ".koookookkk." : i === 10 ? "..kk...kk..." : r));
const CODE_B = IDLE_A.map((r, i) => (i === 9 ? ".kkkookookk." : i === 10 ? "...kk..kk..." : r));
const MUSIC_A = IDLE_A.map((r, i) => (i === 0 ? "..k.....k.n." : i === 1 ? ".kok...kokn." : r));
const MUSIC_B = ["............", ...IDLE_A.slice(0, 10)].map((r, i) => (i === 1 ? ".nk.....k..." : r));
const WATCH_A = IDLE_A.map((r, i) => (i === 3 ? ".kokkooookkk" : i === 4 ? ".kokwoooowok" : r));
const WATCH_B = IDLE_A.map((r, i) => (i === 3 ? ".kkkoooookkk" : i === 4 ? ".kwkoooowkok" : r));
const POKE_A = IDLE_A.map((r, i) => (i === 0 ? "..k..p..k..." : i === 3 ? ".kokoooookk." : r));
const POKE_B = IDLE_A.map((r, i) => (i === 0 ? ".pk..p..kp.." : i === 4 ? ".kooooooook." : r));

const FRAMES: Record<Mood, string[][]> = {
  idle: [IDLE_A, IDLE_A, IDLE_A, IDLE_B],
  sleep: [SLEEP_A, SLEEP_B],
  code: [CODE_A, CODE_B],
  music: [MUSIC_A, MUSIC_B],
  watch: [WATCH_A, WATCH_B],
  poke: [POKE_A, POKE_B],
};
const CAPTION: Record<Mood, string> = { idle: "waiting for something to happen", sleep: "zzz. luis is away, so is the cat.", code: "supervising the code", music: "bopping along", watch: "watching too, apparently", poke: "purr." };

function Sprite({ grid }: { grid: string[] }) {
  const h = grid.length;
  const w = grid[0].length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w * 5} height={h * 5} shapeRendering="crispEdges" aria-hidden>
      {grid.flatMap((row, y) => [...row].map((c, x) => (c === "z" ? <text key={`${x}-${y}`} x={x} y={y + 1} fontSize="1.4" fill="var(--ink-soft)" fontFamily="var(--font-pixel)">z</text> : PIX[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PIX[c]} /> : null)))}
    </svg>
  );
}

export function Pet({ initialPokes }: { initialPokes: number }) {
  const { data } = useLanyardContext();
  const [frame, setFrame] = useState(0);
  const [poked, setPoked] = useState(false);
  const [pokes, setPokes] = useState(initialPokes);

  let mood: Mood = "idle";
  if (data) {
    const kinds = resolveAll(data.activities).map((r) => r.info.kind);
    if (data.discord_status === "offline" || data.discord_status === "idle") mood = "sleep";
    else if (kinds.includes("watching")) mood = "watch";
    else if (kinds.includes("coding")) mood = "code";
    else if (kinds.includes("listening")) mood = "music";
  }
  if (poked) mood = "poke";

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => f + 1), mood === "sleep" ? 900 : 450);
    return () => clearInterval(id);
  }, [mood]);

  const poke = async () => {
    setPoked(true);
    setPokes((n) => n + 1);
    setTimeout(() => setPoked(false), 1500);
    try {
      const res = await fetch("/api/pet", { method: "POST" });
      if (res.ok) setPokes((await res.json()).pokes);
    } catch {}
  };

  const frames = FRAMES[mood];
  return (
    <button type="button" onClick={poke} className="w-full flex items-center gap-3 text-left cursor-pointer group" aria-label="poke the cat">
      <span className="shrink-0 border border-dashed border-line bg-paper-2 p-1 group-hover:border-accent transition-colors">
        <Sprite grid={frames[frame % frames.length]} />
      </span>
      <span className="min-w-0 text-[11px]">
        <span className="pixel text-ink block">mochi</span>
        <span className="text-ink-soft block">{CAPTION[mood]}</span>
        <span className="text-[10px] text-ink-soft block mt-0.5">poked {pokes.toLocaleString("en-US")} times · click to pet</span>
      </span>
    </button>
  );
}
