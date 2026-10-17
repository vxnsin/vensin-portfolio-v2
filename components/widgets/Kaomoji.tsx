"use client";

import { useState } from "react";
import { site } from "@/data/site";

/** Click to cycle through kaomoji. Small, silly, on brand. they are cute and fun! */
export function Kaomoji({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);
  return (
    <button
      type="button"
      onClick={() => setI((n) => (n + 1) % site.kaomoji.length)}
      className={`cursor-pointer select-none hover:text-accent transition-colors ${className}`}
      title="click me"
    >
      {site.kaomoji[i]}
    </button>
  );
}
