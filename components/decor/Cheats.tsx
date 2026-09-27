"use client";

import { useEffect, useState } from "react";
import { readForm, restoreForm, setForm } from "@/components/widgets/mochi-form";
import { MoonScene } from "./MoonScene";

// Words you can type anywhere on the site (not in a text field):
//   catgirl  - mochi turns into a pixel catgirl; type it again and she is a cat again. she remembers.
//   moon     - the site fades out and two people sit on the moon. esc, a click or the word again brings it back.

const CODES = ["catgirl", "moon"];
const LONGEST = Math.max(...CODES.map((c) => c.length));

export function Cheats() {
  const [moon, setMoon] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    restoreForm();
    let buffer = "";
    let noteTimer: ReturnType<typeof setTimeout> | undefined;
    const say = (text: string) => {
      setNote(text);
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => setNote(null), 4000);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoon(false);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-LONGEST);
      if (buffer.endsWith("catgirl")) {
        buffer = "";
        const next = readForm() === "catgirl" ? "cat" : "catgirl";
        setForm(next);
        say(next === "catgirl" ? "nya~ mochi is a catgirl now. type it again to change her back." : "mochi is a cat again.");
      } else if (buffer.endsWith("moon")) {
        buffer = "";
        setMoon((m) => !m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(noteTimer);
    };
  }, []);

  return (
    <>
      {moon && <MoonScene onClose={() => setMoon(false)} />}
      {note && (
        <div className="cheat-note fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] win win-dashed text-xs px-3 py-2 max-w-[90vw]" role="status">
          {note}
        </div>
      )}
    </>
  );
}
