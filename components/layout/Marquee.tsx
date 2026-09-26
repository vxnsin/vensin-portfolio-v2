export function Marquee({ items }: { items: string[] }) {
  const text = items.map((s) => ` ${s} //`).join("");
  return (
    <div className="marquee text-xs text-ink-soft py-1" aria-hidden>
      <span className="marquee-track">
        <span>{text}</span>
        <span>{text}</span>
      </span>
    </div>
  );
}
