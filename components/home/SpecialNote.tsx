"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { isSeason, seasonNote, SEASON_ICON, type Season } from "@/lib/season-data";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });
  return () => obs.disconnect();
}

/** a personal note on the home page for special days; follows <html data-season> like the particles do */
export function SpecialNote({ initial }: { initial: Season }) {
  const season = useSyncExternalStore(
    subscribe,
    () => {
      const v = document.documentElement.getAttribute("data-season");
      return isSeason(v) ? v : initial;
    },
    () => initial,
  );
  const note = seasonNote(season);
  if (!note) return null;
  return (
    <div className="border-2 border-dashed border-accent bg-accent-soft/60 px-4 py-3 grid gap-1">
      <div className="pixel text-accent">
        {SEASON_ICON[season]} {note.title}
      </div>
      <p className="text-xs">
        {note.text}
        {note.link && (
          <>
            {" "}
            <Link href={note.link.href}>{note.link.label}</Link>
          </>
        )}
      </p>
    </div>
  );
}
