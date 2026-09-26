import type { Metadata } from "next";
import { projects } from "@/data/projects";
import { ProjectGrid } from "@/components/projects/ProjectGrid";

export const metadata: Metadata = { title: "projects" };

export default function ProjectsPage() {
  const active = projects.filter((p) => p.status === "active").length;
  const first = Math.min(...projects.map((p) => p.start));
  const techs = new Set(projects.flatMap((p) => p.tech)).size;

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">projects.</h2>
        <p className="text-xs text-ink-soft">
          things i built, ran, or learned from. some are alive, some are archived, some got nuked. all of them taught me something.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat value={String(projects.length)} label="projects" />
        <Stat value={String(active)} label="active" />
        <Stat value={`${first}+`} label={`building since · ${techs} techs`} />
      </div>

      <ProjectGrid projects={projects} />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-dashed border-line bg-paper-2 py-2">
      <div className="pixel text-2xl text-accent-2">{value}</div>
      <div className="text-[10px] text-ink-soft truncate px-1">{label}</div>
    </div>
  );
}
