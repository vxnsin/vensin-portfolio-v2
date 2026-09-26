"use client";

import Image from "next/image";
import { useState } from "react";
import type { Project, ProjectStatus } from "@/data/projects";

const STATUS: Record<ProjectStatus, { color: string; label: string }> = {
  active: { color: "var(--ok)", label: "active" },
  archived: { color: "var(--idle)", label: "archived" },
  "shut down": { color: "var(--off)", label: "shut down" },
};

const FILTERS: Array<{ key: "all" | ProjectStatus; label: string }> = [
  { key: "all", label: "all" },
  { key: "active", label: "active" },
  { key: "archived", label: "archived" },
  { key: "shut down", label: "shut down" },
];

const LINK_ICON: Record<Project["links"][number]["type"], string> = { github: "⌥", discord: "◉", website: "↗" };

function years(p: Project) {
  if (!p.end) return `${p.start} – now`;
  return p.start === p.end ? `${p.start}` : `${p.start} – ${p.end}`;
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [open, setOpen] = useState<string | null>(null);

  const sorted = [...projects].sort((a, b) => (b.end ?? 9999) - (a.end ?? 9999) || b.start - a.start);
  const visible = filter === "all" ? sorted : sorted.filter((p) => p.status === filter);
  const count = (k: (typeof FILTERS)[number]["key"]) => (k === "all" ? projects.length : projects.filter((p) => p.status === k).length);

  return (
    <div className="grid gap-4">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-ink-soft mr-1">show:</span>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className="chip cursor-pointer hover:bg-accent-soft"
            style={filter === f.key ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
          >
            {f.key !== "all" && <span className="status-dot" style={{ background: STATUS[f.key].color, borderWidth: 0, width: 7, height: 7 }} />}
            {f.label} <span className="text-ink-soft">{count(f.key)}</span>
          </button>
        ))}
      </div>

      {/* cards */}
      <ul className="grid gap-4 sm:grid-cols-2">
        {visible.map((p) => {
          const st = STATUS[p.status];
          const expanded = open === p.slug;
          return (
            <li key={p.slug} className="win flex flex-col transition-transform hover:-translate-y-0.5">
              <div className="win-title">
                <span className="dots" aria-hidden>
                  <i style={{ background: st.color }} />
                  <i />
                  <i />
                </span>
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-[10px] font-mono text-ink-soft">{years(p)}</span>
              </div>

              <div className="relative aspect-[16/9] border-b border-line bg-paper-2 overflow-hidden">
                <Image src={p.thumbnail} alt={p.name} fill sizes="(max-width: 640px) 100vw, 340px" className="object-cover" />
                <span className="absolute top-1.5 left-1.5 chip text-[10px] bg-paper">
                  <span className="status-dot" style={{ background: st.color, borderWidth: 0, width: 7, height: 7 }} />
                  {st.label}
                </span>
              </div>

              <div className="p-3 grid gap-2 text-xs flex-1">
                <div className="text-ink-soft italic">{p.tagline} · {p.role}</div>
                <p>{p.description}</p>

                {p.highlights && (
                  <div>
                    <button type="button" onClick={() => setOpen(expanded ? null : p.slug)} className="text-[11px] text-accent-2 hover:text-accent cursor-pointer">
                      {expanded ? "▾ hide highlights" : "▸ highlights"}
                    </button>
                    {expanded && (
                      <ul className="mt-1 pl-4 list-[square] text-[11px] text-ink-soft grid gap-0.5">
                        {p.highlights.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {p.tech.map((t) => (
                    <span key={t} className="chip text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-auto pt-1">
                  {p.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn text-[11px] no-underline">
                      {LINK_ICON[l.type]} {l.label ?? l.type}
                      {l.archived && <span className="text-ink-soft">(archived)</span>}
                    </a>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && <p className="text-xs text-ink-soft text-center py-6">nothing here (´・ω・`)</p>}
    </div>
  );
}
