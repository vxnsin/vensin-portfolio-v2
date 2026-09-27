"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isSeason, type Season } from "@/lib/season-data";
import { FRAME_MS, FRAMES, Sprite } from "./cat-frames";

function subscribeSeason(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });
  return () => obs.disconnect();
}
const readSeason = (): Season | null => {
  const v = document.documentElement.getAttribute("data-season");
  return isSeason(v) ? v : null;
};

/** mochi looking around on the 404 and error pages, dressed for the season like in the sidebar */
export function LostCat({ scale = 8 }: { scale?: number }) {
  const [frame, setFrame] = useState(0);
  const season = useSyncExternalStore(subscribeSeason, readSeason, () => null);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => f + 1), FRAME_MS.lost);
    return () => clearInterval(id);
  }, []);
  const frames = FRAMES.lost;
  return (
    <span className="inline-block border border-dashed border-line bg-paper-2 p-2">
      <Sprite frame={frames[frame % frames.length]} season={season} scale={scale} />
    </span>
  );
}
