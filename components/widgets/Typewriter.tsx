"use client";

import { useEffect, useState } from "react";

export function Typewriter({ words, className = "" }: { words: string[]; className?: string }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx % words.length];
    let delay = deleting ? 40 : 70;

    if (!deleting && text === word) delay = 1800;
    if (deleting && text === "") delay = 300;

    const id = setTimeout(() => {
      if (!deleting) {
        if (text === word) setDeleting(true);
        else setText(word.slice(0, text.length + 1));
      } else {
        if (text === "") {
          setDeleting(false);
          setWordIdx((i) => (i + 1) % words.length);
        } else setText(word.slice(0, text.length - 1));
      }
    }, delay);

    return () => clearTimeout(id);
  }, [text, deleting, wordIdx, words]);

  return (
    <span className={className}>
      {text}
      <span className="blink">▌</span>
    </span>
  );
}
