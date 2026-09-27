"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLanyardContext } from "@/components/discord/LanyardProvider";
import { resolveAll } from "@/components/discord/activities";
import { isSeason, type Season } from "@/lib/season-data";
import { CAPTION, FRAME_MS, FRAMES, Sprite, type Mood } from "./cat-frames";

// Mochi lives in the sidebar and reacts to the discord status: asleep when idle or offline, tapping away while coding,
// bopping to music, wide-eyed during anime, stretching and flicking her tail otherwise, purring when poked.
// She also dresses for the season (see the accessories in cat-frames.tsx).

function subscribeSeason(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });
  return () => obs.disconnect();
}
const readSeason = (): Season | null => {
  const v = document.documentElement.getAttribute("data-season");
  return isSeason(v) ? v : null;
};

export function Pet({ initialPokes, season: initialSeason }: { initialPokes: number; season: Season }) {
  const { data } = useLanyardContext();
  const season = useSyncExternalStore(subscribeSeason, readSeason, () => initialSeason);
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
    const id = setInterval(() => setFrame((f) => f + 1), FRAME_MS[mood]);
    return () => clearInterval(id);
  }, [mood]);

  // other people poke her too: keep the number moving while the page is open
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/pet", { cache: "no-store" });
        if (res.ok) {
          const j = (await res.json()) as { pokes: number };
          if (alive) setPokes((n) => Math.max(n, j.pokes));
        }
      } catch {}
    };
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const poke = async () => {
    setPoked(true);
    setPokes((n) => n + 1);
    setTimeout(() => setPoked(false), 1600);
    try {
      const res = await fetch("/api/pet", { method: "POST" });
      if (res.ok) setPokes((await res.json()).pokes);
    } catch {}
  };

  const frames = FRAMES[mood];
  return (
    <button type="button" onClick={poke} className="w-full flex items-center gap-3 text-left cursor-pointer group" aria-label="poke the cat">
      <span className="shrink-0 border border-dashed border-line bg-paper-2 p-1 group-hover:border-accent transition-colors">
        <Sprite frame={frames[frame % frames.length]} season={season} />
      </span>
      <span className="min-w-0 text-[11px]">
        <span className="pixel text-ink block">mochi</span>
        <span className="text-ink-soft block">{CAPTION[mood]}</span>
        <span className="text-[10px] text-ink-soft block mt-0.5">poked {pokes.toLocaleString("en-US")} times · click to pet</span>
      </span>
    </button>
  );
}
