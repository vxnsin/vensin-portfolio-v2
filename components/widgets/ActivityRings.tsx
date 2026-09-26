import type { Health } from "@/lib/store";

const RINGS = [
  { key: "move", goal: "moveGoal", color: "#fa114f", label: "move", unit: "kcal" },
  { key: "exercise", goal: "exerciseGoal", color: "#92e82a", label: "exercise", unit: "min" },
  { key: "stand", goal: "standGoal", color: "#00d4ff", label: "stand", unit: "h" },
] as const;

function Ring({ r, pct, color }: { r: number; pct: number; color: string }) {
  const c = 2 * Math.PI * r;
  const p = Math.min(pct, 1);
  return (
    <>
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeOpacity="0.2" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${c * p} ${c}`}
        transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dasharray .6s ease" }}
      />
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

/** Apple Watch style activity rings, fed by /api/health. */
export function ActivityRings({ health }: { health: Health }) {
  const closed = RINGS.filter((r) => health[r.key] >= health[r.goal]).length;
  return (
    <div className="flex items-center gap-4 justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-label="activity rings">
        <Ring r={52} pct={health.move / health.moveGoal} color={RINGS[0].color} />
        <Ring r={39} pct={health.exercise / health.exerciseGoal} color={RINGS[1].color} />
        <Ring r={26} pct={health.stand / health.standGoal} color={RINGS[2].color} />
      </svg>
      <div className="text-[11px] grid gap-0.5 min-w-0">
        {RINGS.map((r) => (
          <div key={r.key} className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
            <span className="text-ink-soft w-14">{r.label}</span>
            <span className="pixel">
              {Math.round(health[r.key])}
              <span className="text-ink-soft">/{health[r.goal]}</span>
            </span>
          </div>
        ))}
        {typeof health.steps === "number" && (
          <div className="text-ink-soft mt-0.5">👟 {health.steps.toLocaleString("de-DE")} steps</div>
        )}
        <div className="text-[10px] text-ink-soft mt-0.5">
          {closed === 3 ? "all rings closed ✦" : `${closed}/3 closed`} · {ago(health.updatedAt)}
        </div>
      </div>
    </div>
  );
}
