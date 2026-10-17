import type { Health } from "@/lib/store";

const RINGS = [
  { key: "move", goal: "moveGoal", color: "#ff4d6d", label: "move", unit: "kcal" },
  { key: "exercise", goal: "exerciseGoal", color: "#8fe36b", label: "exercise", unit: "min" },
  { key: "stand", goal: "standGoal", color: "#5ad7ff", label: "stand", unit: "h" },
] as const;

// move data is buggy right now: the ring is shown greyed out as "n/a" and left out of the closed count. flip back to false once fixed.
const MOVE_DISABLED = true;
const isOff = (key: string) => MOVE_DISABLED && key === "move";

const GRID = 31; // cells per side
const CELL = 3; // screen pixels per cell
const SIZE = GRID * CELL;
const CENTER = (GRID - 1) / 2;

/** one ring rasterised onto the pixel grid: every cell whose distance to the centre falls inside [inner, outer), filled clockwise from the top */
function PixelRing({ inner, outer, pct, color }: { inner: number; outer: number; pct: number; color: string }) {
  const fill = Math.max(0, Math.min(pct, 1));
  const cells: Array<{ x: number; y: number; on: boolean }> = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const dx = x - CENTER;
      const dy = y - CENTER;
      const d = Math.hypot(dx, dy);
      if (d < inner || d >= outer) continue;
      let a = Math.atan2(dx, -dy); // 0 at the top, growing clockwise
      if (a < 0) a += Math.PI * 2;
      cells.push({ x, y, on: fill >= 1 || a / (Math.PI * 2) < fill });
    }
  }
  return (
    <>
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={1} height={1} fill={color} opacity={c.on ? 1 : 0.18} />
      ))}
    </>
  );
}

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

/** Apple Watch rings in pixel style, fed by /api/health. */
export function ActivityRings({ health }: { health: Health }) {
  const active = RINGS.filter((r) => !isOff(r.key));
  const closed = active.filter((r) => health[r.key] >= health[r.goal]).length;
  const total = active.length;
  return (
    <div className="flex items-center gap-3 justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${GRID} ${GRID}`} shapeRendering="crispEdges" aria-label="activity rings" className="shrink-0">
        <PixelRing inner={12} outer={15} pct={MOVE_DISABLED ? 0 : health.move / health.moveGoal} color={MOVE_DISABLED ? "var(--ink-soft)" : RINGS[0].color} />
        <PixelRing inner={8} outer={11} pct={health.exercise / health.exerciseGoal} color={RINGS[1].color} />
        <PixelRing inner={4} outer={7} pct={health.stand / health.standGoal} color={RINGS[2].color} />
        <text x={CENTER + 0.5} y={CENTER + 1.6} textAnchor="middle" fontSize="3.4" fill="var(--ink)" fontFamily="var(--font-pixel)" shapeRendering="auto">
          {closed}/{total}
        </text>
      </svg>
      <div className="text-[11px] grid gap-0.5 min-w-0 flex-1 max-w-[150px]">
        {RINGS.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-2">
            <span style={{ color: isOff(r.key) ? "var(--ink-soft)" : r.color }}>{r.label}</span>
            {isOff(r.key) ? (
              <span className="pixel whitespace-nowrap text-ink-soft" title="temporarily unavailable">n/a</span>
            ) : (
              <span className="pixel whitespace-nowrap">
                {Math.round(health[r.key])}
                <span className="text-ink-soft">/{health[r.goal]}</span>
              </span>
            )}
          </div>
        ))}
        {typeof health.steps === "number" && <div className="text-ink-soft mt-0.5">{health.steps.toLocaleString("de-DE")} steps</div>}
        <div className="text-[10px] text-ink-soft mt-0.5">
          {closed === total ? "all rings closed ✦" : `${closed}/${total} closed`} · {ago(health.updatedAt)}
        </div>
      </div>
    </div>
  );
}
