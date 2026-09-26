import type { Metadata } from "next";
import Image from "next/image";
import { projects, type Project } from "@/data/projects";

export const metadata: Metadata = { title: "projects" };

const STATUS_COLOR: Record<Project["status"], string> = {
  active: "var(--ok)",
  archived: "var(--idle)",
  "shut down": "var(--off)",
};

export default function ProjectsPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">projects.</h2>
        <p className="text-ink-soft text-xs">
          things i built, ran, or learned from. some are alive, some are archived, some got nuked. all of them taught me something.
        </p>
      </div>

      <ul className="grid gap-4">
        {projects.map((p) => (
          <li key={p.slug} className="win win-dashed">
            <div className="grid sm:grid-cols-[180px_1fr]">
              <div className="relative aspect-video sm:aspect-auto sm:min-h-[120px] border-b sm:border-b-0 sm:border-r border-line bg-paper-2">
                <Image src={p.thumbnail} alt={p.name} fill sizes="(max-width: 640px) 100vw, 180px" className="object-cover" />
              </div>
              <div className="p-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="pixel text-base">{p.name}</h3>
                  <span className="chip">
                    <span className="status-dot" style={{ background: STATUS_COLOR[p.status], borderWidth: 0, width: 8, height: 8 }} />
                    {p.status}
                  </span>
                  <span className="text-[11px] text-ink-soft">{p.years}</span>
                </div>
                <p className="text-xs mb-2">{p.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.tech.map((t) => (
                    <span key={t} className="chip text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {p.links.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn text-[11px] no-underline">
                      {l.type === "github" ? "⌥" : l.type === "discord" ? "◉" : "↗"} {l.label ?? l.type}
                      {l.archived && <span className="text-ink-soft">(archived)</span>}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
