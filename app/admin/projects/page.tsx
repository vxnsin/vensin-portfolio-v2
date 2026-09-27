import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listProjects, getProject } from "@/lib/projects";
import { deleteProjectAction, moveProjectAction } from "../actions";
import { ProjectForm } from "./ProjectForm";

export const dynamic = "force-dynamic";

export default async function AdminProjects({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin();
  const { edit } = await searchParams;
  const projects = listProjects();
  const editing = edit ? getProject(edit) : null;

  return (
    <div className="grid gap-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="pixel text-accent">projects ({projects.length})</h2>
        {editing && (
          <Link href="/admin/projects" className="btn text-[11px] no-underline">
            + new project instead
          </Link>
        )}
      </div>

      <ProjectForm key={editing?.id ?? "new"} project={editing ?? undefined} />

      <ul className="grid gap-2 text-xs">
        {projects.map((p, i) => (
          <li key={p.id} className="win win-dashed" style={{ opacity: editing && editing.id !== p.id ? 0.7 : 1 }}>
            <div className="win-title">
              <span className="dots" aria-hidden>
                <i style={{ background: p.status === "active" ? "var(--ok)" : p.status === "archived" ? "var(--idle)" : "var(--off)" }} />
                <i />
                <i />
              </span>
              <span className="flex-1 truncate">
                {p.name} <span className="text-ink-soft">· {p.tagline}</span>
              </span>
              <span className="text-[10px] text-ink-soft">
                {p.status} · {p.start}
                {p.end ? `–${p.end}` : "–now"} · /{p.slug}
              </span>
            </div>
            <div className="win-body flex gap-2 flex-wrap items-center">
              <span className="text-ink-soft mr-auto truncate">{p.tech.join(", ") || "no tech listed"}</span>
              <Link href={`/admin/projects?edit=${p.id}`} className="btn text-[11px] no-underline">
                edit
              </Link>
              <form action={moveProjectAction}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="dir" value="-1" />
                <button type="submit" className="btn text-[11px]" disabled={i === 0}>
                  ↑
                </button>
              </form>
              <form action={moveProjectAction}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="dir" value="1" />
                <button type="submit" className="btn text-[11px]" disabled={i === projects.length - 1}>
                  ↓
                </button>
              </form>
              <form action={deleteProjectAction}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="btn text-[11px]" style={{ color: "var(--dnd)" }}>
                  delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-ink-soft">order here is only a tie-breaker: the public page sorts by year, newest first. the thumbnail of an uploaded image lands in the uploads folder.</p>
    </div>
  );
}
