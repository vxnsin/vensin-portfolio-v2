import { visitorStats } from "@/lib/visits";

/** the classic hit counter: a little bezel with six glowing digits, plus today's count in small print */
export function VisitorCounter() {
  const { total, today } = visitorStats();
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
          <span key={i} className="pixel text-sm leading-none w-[13px] py-[2px] text-center rounded-[1px]" style={{ background: "#14101a", color: "#ffd54a", textShadow: "0 0 4px rgba(255,213,74,0.7)" }}>
            {d}
          </span>
        ))}
      </span>
      <span>· {today} today</span>
    </div>
  );
}
