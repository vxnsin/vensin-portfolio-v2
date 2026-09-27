"use client";

import { useEffect, useRef, useState } from "react";

// April fools homage to the 2004 "you are an idiot" window: flashes, bounces around, and closing the first one spawns two more. No sound, promise.

const W = 260;
const H = 120;

export function IdiotWindow({
  seed,
  onClose,
}: {
  seed: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => ({
    x: 80 + ((seed * 137) % 300),
    y: 80 + ((seed * 89) % 200),
  }));
  const vel = useRef({
    vx: 2.2 + (seed % 3) * 0.6,
    vy: 1.6 + (seed % 2) * 0.7,
  });

  useEffect(() => {
    let raf = 0;
    let cur = { ...pos };
    const step = () => {
      const maxX = window.innerWidth - W;
      const maxY = window.innerHeight - H;
      let { vx, vy } = vel.current;
      cur = { x: cur.x + vx, y: cur.y + vy };
      if (cur.x <= 0 || cur.x >= maxX) vx = -vx;
      if (cur.y <= 0 || cur.y >= maxY) vy = -vy;
      cur.x = Math.max(0, Math.min(maxX, cur.x));
      cur.y = Math.max(0, Math.min(maxY, cur.y));
      vel.current = { vx, vy };
      setPos(cur);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className="fools-ui fixed z-[60]"
      style={{ left: pos.x, top: pos.y, width: W }}
      role="dialog"
      aria-label="you are an idiot"
    >
      <div className="win">
        <div className="win-title">
          <span className="dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="flex-1 truncate">important message</span>
          <button
            type="button"
            className="text-[11px] px-1 leading-none hover:text-accent"
            onClick={onClose}
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <div
          className="idiot win-body text-center select-none"
          style={{ height: H - 28 }}
        >
          <div className="pixel text-base">You are an idiot!</div>
          <div className="text-lg tracking-[0.35em] mt-1">☺☺☺☺☺☺</div>
        </div>
      </div>
    </div>
  );
}
