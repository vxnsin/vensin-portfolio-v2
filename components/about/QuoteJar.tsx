"use client";

import { useState } from "react";

type Quote = { text: string; by: string };

/** one quote from the jar, and a button that pulls out a different one without reloading */
export function QuoteJar({ quotes, initial }: { quotes: Quote[]; initial: number }) {
  const [index, setIndex] = useState(initial);
  if (quotes.length === 0) return <p className="text-ink-soft">no quotes yet.</p>;
  const q = quotes[index % quotes.length];
  const another = () => {
    if (quotes.length < 2) return;
    let next = index;
    while (next === index) next = Math.floor(Math.random() * quotes.length);
    setIndex(next);
  };
  return (
    <div className="grid gap-2">
      <blockquote className="pixel text-base text-ink">&ldquo;{q.text}&rdquo;</blockquote>
      <p className="text-ink-soft">— {q.by || "unknown"}</p>
      {quotes.length > 1 && (
        <button type="button" onClick={another} className="btn w-fit text-[11px]">
          another one →
        </button>
      )}
    </div>
  );
}
