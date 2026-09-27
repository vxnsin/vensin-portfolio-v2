"use client";

import { useEffect, useState } from "react";
import { FRAME_MS, FRAMES, Sprite } from "./cat-frames";

/** mochi looking around on the 404 and error pages */
export function LostCat({ scale = 8 }: { scale?: number }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => f + 1), FRAME_MS.lost);
    return () => clearInterval(id);
  }, []);
  const frames = FRAMES.lost;
  return (
    <span className="inline-block border border-dashed border-line bg-paper-2 p-2">
      <Sprite grid={frames[frame % frames.length]} scale={scale} />
    </span>
  );
}
