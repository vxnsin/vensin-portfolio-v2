import { visitorStats } from "@/lib/visits";

/** the classic odometer in the footer: lifetime visitors, plus today's count in small print */
export function VisitorCounter() {
  const { total, today } = visitorStats();
  const digits = String(total).padStart(6, "0").split("");
  return (
    <div className="flex items-center gap-2 text-[10px] text-ink-soft" title={`${today} today`}>
      <span>visitors</span>
      <span className="inline-flex gap-px" aria-label={`${total} visitors so far`}>
        {digits.map((d, i) => (
          <span key={i} className="pixel text-sm leading-none px-1 py-0.5 bg-ink text-paper border border-line">
            {d}
          </span>
        ))}
      </span>
      <span>· {today} today</span>
    </div>
  );
}
