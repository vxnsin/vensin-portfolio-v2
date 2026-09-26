"use client";

import { useState } from "react";
import type { Season } from "@/lib/season-data";

/** one card per season: details plus a live preview of the home page in that season (admin-only ?season= override) */
export function SeasonShowcase({
  seasons,
  current,
  pinned,
  pinAction,
}: {
  seasons: Array<{ id: Season; icon: string; label: string; when: string; kind: "season" | "special"; greeting: string | null; note: { title: string; text: string } | null }>;
  current: Season;
  pinned: string;
  pinAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState<Season | null>(null);

  return (
    <ul className="grid gap-4">
      {seasons.map((s) => {
        const showing = open === s.id;
        return (
          <li key={s.id} className="win win-dashed">
            <div className="win-title">
              <span className="dots" aria-hidden>
                <i style={{ background: current === s.id ? "var(--ok)" : pinned === s.id ? "var(--idle)" : undefined }} />
                <i />
                <i />
              </span>
              <span className="flex-1 truncate">
                {s.icon} {s.label}
              </span>
              <span className="text-[10px] text-ink-soft">
                {s.kind === "special" ? "special · not in the visitor picker" : "pickable"}
                {current === s.id ? " · showing now" : ""}
                {pinned === s.id ? " · pinned as default" : ""}
              </span>
            </div>
            <div className="win-body text-xs grid gap-2">
              <div className="grid sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <span className="text-ink-soft">when</span>
                <span>{s.when}</span>
                <span className="text-ink-soft">under the title</span>
                <span>{s.greeting ? `${s.icon} ${s.greeting} ${s.icon}` : "—"}</span>
                <span className="text-ink-soft">home note</span>
                <span>
                  {s.note ? (
                    <>
                      <b>{s.note.title}</b> {s.note.text}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className="btn text-[11px]" onClick={() => setOpen(showing ? null : s.id)}>
                  {showing ? "hide preview" : "preview here"}
                </button>
                <a href={`/?season=${s.id}`} target="_blank" rel="noreferrer" className="btn text-[11px] no-underline">
                  open in a tab ↗
                </a>
                <form action={pinAction}>
                  <input type="hidden" name="season" value={pinned === s.id ? "auto" : s.id} />
                  <button type="submit" className="btn text-[11px]">
                    {pinned === s.id ? "unpin (back to calendar)" : "pin as site default"}
                  </button>
                </form>
              </div>
              {showing && (
                <iframe
                  src={`/?season=${s.id}`}
                  title={`preview: ${s.label}`}
                  className="w-full border border-line bg-paper"
                  style={{ height: 720 }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
