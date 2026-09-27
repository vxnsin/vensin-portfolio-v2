"use client";

import { useActionState } from "react";
import { saveProjectAction, type ActionState } from "../actions";
import type { ProjectRow } from "@/lib/projects";
import { Window } from "@/components/layout/Window";

const STATUSES = ["active", "archived", "shut down"] as const;

/** add or edit one project. links are one per line as "type | label | url" (type: github, website or discord; label optional) */
export function ProjectForm({ project }: { project?: ProjectRow }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProjectAction, null);
  const p = project;
  return (
    <form action={action} className="grid gap-3 text-xs">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Window title={p ? `edit · ${p.name}` : "new project"} dashed>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-ink-soft">name</span>
            <input name="name" required maxLength={80} defaultValue={p?.name} className="input" />
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">slug (url name, optional)</span>
            <input name="slug" maxLength={60} defaultValue={p?.slug} className="input" placeholder="auto from name" />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-ink-soft">tagline (one line)</span>
            <input name="tagline" required maxLength={120} defaultValue={p?.tagline} className="input" />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-ink-soft">description</span>
            <textarea name="description" required rows={4} maxLength={1200} defaultValue={p?.description} className="input" />
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">tech (comma separated)</span>
            <input name="tech" defaultValue={p?.tech.join(", ")} className="input" placeholder="TypeScript, Next.js" />
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">role</span>
            <input name="role" maxLength={60} defaultValue={p?.role ?? "design + code"} className="input" />
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">start year</span>
            <input name="start" type="number" required min={2000} max={2100} defaultValue={p?.start ?? new Date().getFullYear()} className="input" />
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">end year (empty = ongoing)</span>
            <input name="end" type="number" min={2000} max={2100} defaultValue={p?.end ?? ""} className="input" />
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">status</span>
            <select name="status" defaultValue={p?.status ?? "active"} className="input">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">thumbnail url (or upload below)</span>
            <input name="thumbnail" defaultValue={p?.thumbnail} className="input" placeholder="https://opengraph.githubassets.com/1/vxnsin/repo" />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-ink-soft">thumbnail upload (jpg, png, webp, heic · replaces the url)</span>
            <input name="thumbnailFile" type="file" accept="image/*,.heic,.heif" className="input" />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-ink-soft">highlights (one per line)</span>
            <textarea name="highlights" rows={3} defaultValue={p?.highlights?.join("\n")} className="input font-mono" />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-ink-soft">links (one per line: type | label | url · type is github, website or discord · label optional)</span>
            <textarea name="links" rows={3} defaultValue={p?.links.map((l) => [l.type, l.label ?? "", l.url].join(" | ")).join("\n")} className="input font-mono" placeholder={"github | | https://github.com/vxnsin/repo\nwebsite | live | https://example.org"} />
          </label>
        </div>
        <p className="text-[10px] text-ink-soft mt-2">tip: a github repo gets a free thumbnail at https://opengraph.githubassets.com/1/&lt;owner&gt;/&lt;repo&gt;</p>
      </Window>
      {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}
      {state?.ok && <p style={{ color: "var(--ok)" }}>saved ✓</p>}
      <button type="submit" disabled={pending} className="btn w-fit disabled:opacity-60">
        {pending ? "saving…" : p ? "save changes →" : "add project →"}
      </button>
    </form>
  );
}
