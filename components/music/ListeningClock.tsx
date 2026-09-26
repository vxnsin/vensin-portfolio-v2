const DAYS = ["su", "mo", "tu", "we", "th", "fr", "sa"];

/** 24 bars, one per hour of the day, plus a small weekday strip. Minutes listened. */
export function ListeningClock({ byHour, byWeekday }: { byHour: number[]; byWeekday: number[] }) {
  const max = Math.max(1, ...byHour);
  const peak = byHour.indexOf(Math.max(...byHour));
  const wmax = Math.max(1, ...byWeekday);
  const H = 56;

  return (
    <div className="grid gap-3 text-[10px] text-ink-soft">
      <div>
        <svg viewBox={`0 0 ${24 * 12} ${H + 14}`} className="w-full" style={{ maxHeight: 96 }} shapeRendering="crispEdges">
          {byHour.map((m, h) => {
            const bh = Math.round((m / max) * H);
            return (
              <g key={h}>
                <rect x={h * 12 + 1} y={H - bh} width={10} height={bh} fill={h === peak ? "var(--accent)" : "var(--accent-2)"} opacity={h === peak ? 1 : 0.75}>
                  <title>{`${String(h).padStart(2, "0")}:00 · ${m} min`}</title>
                </rect>
                {h % 6 === 0 && (
                  <text x={h * 12 + 1} y={H + 11} fontSize="9" fill="var(--ink-soft)" fontFamily="var(--font-mono)">
                    {String(h).padStart(2, "0")}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div>
          most listening around <b className="text-ink">{String(peak).padStart(2, "0")}:00</b>
          {peak >= 22 || peak < 5 ? " · night owl confirmed" : peak < 11 ? " · morning person?!" : ""}
        </div>
      </div>
      <div className="flex items-end gap-1.5">
        {byWeekday.map((m, d) => (
          <div key={d} className="flex flex-col items-center gap-0.5 flex-1">
            <div className="w-full bg-accent-2" style={{ height: 4 + Math.round((m / wmax) * 20), opacity: 0.75 }} title={`${DAYS[d]} · ${m} min`} />
            <span>{DAYS[d]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
