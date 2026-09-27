"use client";

import { useEffect, useState } from "react";

const POLL_MS = 30_000;

/** six digits in a bezel; polls /api/visits and rolls a digit when it changes */
export function LiveCounter({ total: initialTotal, today: initialToday }: { total: number; today: number }) {
  const [total, setTotal] = useState(initialTotal);
  const [today, setToday] = useState(initialToday);
  const [flip, setFlip] = useState<Set<number>>(new Set());

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/visits", { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as { total: number; today: number };
        if (!alive) return;
        setTotal((prev) => {
          if (j.total !== prev) {
            const a = String(prev).padStart(6, "0");
            const b = String(j.total).padStart(6, "0");
            const changed = new Set<number>();
            for (let i = 0; i < 6; i++) if (a[i] !== b[i]) changed.add(i);
            setFlip(changed);
            setTimeout(() => setFlip(new Set()), 600);
          }
          return j.total;
        });
        setToday(j.today);
      } catch {}
    };
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const digits = String(total).padStart(6, "0").split("");
  return (
    <div className="flex items-center gap-2 text-[10px] text-ink-soft">
      <span className="pixel text-[11px] text-ink">you are visitor</span>
      <span
        className="inline-flex gap-[2px] p-[3px] rounded-[2px]"
        style={{ background: "var(--line)", boxShadow: "inset 1px 1px 0 rgba(0,0,0,0.35), 1px 1px 0 var(--paper)" }}
        aria-label={`number ${total}`}
        title={`${today} today`}
      >
        {digits.map((d, i) => (
          <span
            key={i}
            className="pixel text-sm leading-none w-[13px] py-[2px] text-center rounded-[1px] overflow-hidden"
            style={{ background: "#14101a", color: "#ffd54a", textShadow: "0 0 4px rgba(255,213,74,0.7)" }}
          >
            <span className="inline-block" style={flip.has(i) ? { animation: "odometer 0.5s ease-out" } : undefined}>
              {d}
            </span>
          </span>
        ))}
      </span>
      <span>· {today} today</span>
    </div>
  );
}
