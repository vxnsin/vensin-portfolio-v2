import type { Health } from "@/lib/store";

const RINGS = [
  { key: "move", goal: "moveGoal", color: "#ff4d6d", label: "move", unit: "kcal" },
  { key: "exercise", goal: "exerciseGoal", color: "#8fe36b", label: "exercise", unit: "min" },
  { key: "stand", goal: "standGoal", color: "#5ad7ff", label: "stand", unit: "h" },
] as const;

const SIZE = 124;
const PX = 6; // pixel size

/** one ring drawn as a chain of little squares, filled clockwise from the top */
function PixelRing({ r, pct, color }: { r: number; pct: number; color: string }) {
  const n = Math.round((2 * Math.PI * r) / (PX + 1.5));
  const filled = Math.round(Math.min(pct, 1) * n);
  const c = SIZE / 2;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = -Math.PI / 2 + (i / n) * 2 * Math.PI;
        const x = Math.round((c + r * Math.cos(a) - PX / 2) / 2) * 2;
        const y = Math.round((c + r * Math.sin(a) - PX / 2) / 2) * 2;
        const on = i < filled;
        return <rect key={i} x={x} y={y} width={PX} height={PX} fill={color} opacity={on ? 1 : 0.18} shapeRendering="crispEdges" />;
      })}
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
  const closed = RINGS.filter((r) => health[r.key] >= health[r.goal]).length;
  return (
    <div className="flex items-center gap-3 justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-label="activity rings" className="shrink-0">
        <PixelRing r={54} pct={health.move / health.moveGoal} color={RINGS[0].color} />
        <PixelRing r={41} pct={health.exercise / health.exerciseGoal} color={RINGS[1].color} />
        <PixelRing r={28} pct={health.stand / health.standGoal} color={RINGS[2].color} />
        <text x={SIZE / 2} y={SIZE / 2 + 5} textAnchor="middle" fontSize="13" fill="var(--ink)" fontFamily="var(--font-pixel)">
          {closed}/3
        </text>
      </svg>
      <div className="text-[11px] grid gap-0.5 min-w-0">
        {RINGS.map((r) => (
          <div key={r.key} className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 shrink-0" style={{ background: r.color }} />
            <span className="text-ink-soft w-14">{r.label}</span>
            <span className="pixel">
              {Math.round(health[r.key])}
              <span className="text-ink-soft">/{health[r.goal]}</span>
            </span>
          </div>
        ))}
        {typeof health.steps === "number" && <div className="text-ink-soft mt-0.5">👟 {health.steps.toLocaleString("de-DE")} steps</div>}
        <div className="text-[10px] text-ink-soft mt-0.5">
          {closed === 3 ? "all rings closed ✦" : `${closed}/3 closed`} · {ago(health.updatedAt)}
        </div>
      </div>
    </div>
  );
}
