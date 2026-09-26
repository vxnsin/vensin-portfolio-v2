"use client";

import { useState } from "react";

const DAYS = ["su", "mo", "tu", "we", "th", "fr", "sa"];
const DAY_LONG = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const CELL = 14;
const H = 56;

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m} min`);

/** 24 bars, one per hour of the day, plus a weekday strip. Hover a bar for the exact number. */
export function ListeningClock({ byHour, byWeekday }: { byHour: number[]; byWeekday: number[] }) {
  const [hover, setHover] = useState<{ kind: "hour" | "day"; i: number } | null>(null);
  const max = Math.max(1, ...byHour);
  const peak = byHour.indexOf(Math.max(...byHour));
  const wmax = Math.max(1, ...byWeekday);
  const hasData = byHour.some((m) => m > 0);

  let caption: React.ReactNode;
  if (hover?.kind === "hour") {
    const h = hover.i;
    caption = (
      <>
        <b className="text-ink">
          {String(h).padStart(2, "0")}:00 – {String((h + 1) % 24).padStart(2, "0")}:00
        </b>{" "}
        · {fmtMin(byHour[h])}
      </>
    );
  } else if (hover?.kind === "day") {
    caption = (
      <>
        <b className="text-ink">{DAY_LONG[hover.i]}</b> · {fmtMin(byWeekday[hover.i])}
      </>
    );
  } else if (hasData) {
    caption = (
      <>
        most listening around <b className="text-ink">{String(peak).padStart(2, "0")}:00</b>
        {peak >= 22 || peak < 5 ? " · night owl confirmed" : peak < 11 ? " · morning person?!" : ""}
      </>
    );
  } else {
    caption = "no data yet, the clock fills up as you listen.";
  }

  return (
    <div className="grid gap-3 text-[10px] text-ink-soft">
      <div>
        <svg viewBox={`0 0 ${24 * CELL} ${H + 14}`} className="w-full" style={{ maxHeight: 110 }} shapeRendering="crispEdges" onMouseLeave={() => setHover(null)}>
          {byHour.map((m, h) => {
            const bh = Math.max(m > 0 ? 2 : 0, Math.round((m / max) * H));
            const active = hover?.kind === "hour" && hover.i === h;
            return (
              <g key={h} onMouseEnter={() => setHover({ kind: "hour", i: h })}>
                {/* invisible hit area so empty hours are hoverable too */}
                <rect x={h * CELL} y={0} width={CELL} height={H} fill="transparent" />
                <rect x={h * CELL + 1} y={H - bh} width={CELL - 2} height={bh} fill={h === peak || active ? "var(--accent)" : "var(--accent-2)"} opacity={active ? 1 : h === peak ? 0.95 : 0.7} />
                {h % 3 === 0 && (
                  <text x={h * CELL + 1} y={H + 11} fontSize="9" fill={active ? "var(--ink)" : "var(--ink-soft)"} fontFamily="var(--font-mono)">
                    {String(h).padStart(2, "0")}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="min-h-[14px]">{caption}</div>
      </div>
      <div className="flex items-end gap-1.5" onMouseLeave={() => setHover(null)}>
        {byWeekday.map((m, d) => {
          const active = hover?.kind === "day" && hover.i === d;
          return (
            <div key={d} className="flex flex-col items-center gap-0.5 flex-1 cursor-default" onMouseEnter={() => setHover({ kind: "day", i: d })}>
              <div className="w-full" style={{ height: 4 + Math.round((m / wmax) * 20), background: active ? "var(--accent)" : "var(--accent-2)", opacity: active ? 1 : 0.7 }} />
              <span className={active ? "text-ink" : ""}>{DAYS[d]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
