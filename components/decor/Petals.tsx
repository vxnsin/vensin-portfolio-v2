// Deterministic values so server and client render the same markup.
const PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 8 + ((i * 5) % 7),
  fall: 14 + ((i * 7) % 12),
  sway: 3 + (i % 4),
  delay: -((i * 5.3) % 20),
  opacity: 0.25 + ((i * 3) % 5) * 0.06,
}));

export function Petals() {
  return (
    <div className="petals" aria-hidden>
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.fall}s, ${p.sway}s`,
            animationDelay: `${p.delay}s, ${p.delay / 2}s`,
          }}
        />
      ))}
    </div>
  );
}
