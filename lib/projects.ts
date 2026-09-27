import { getDb, uid } from "./db";
import { projects as seed, type Project, type ProjectLink, type ProjectStatus } from "@/data/projects";

// Projects live in sqlite and are edited in /admin/projects. The static list in data/projects.ts is only the seed
// for a fresh database (and a readable example of the shape).

export type { Project, ProjectLink, ProjectStatus };
export type ProjectRow = Project & { id: string; position: number };

type Row = { id: string; slug: string; name: string; tagline: string; description: string; tech: string; thumbnail: string; start: number; end: number | null; status: ProjectStatus; role: string; highlights: string; links: string; position: number };

const parse = <T>(s: string, fallback: T): T => {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

const toProject = (r: Row): ProjectRow => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  tagline: r.tagline,
  description: r.description,
  tech: parse<string[]>(r.tech, []),
  thumbnail: r.thumbnail,
  start: r.start,
  end: r.end ?? undefined,
  status: r.status,
  role: r.role,
  highlights: parse<string[]>(r.highlights, []),
  links: parse<ProjectLink[]>(r.links, []),
  position: r.position,
});

let seeded = false;
function ensureSeed() {
  if (seeded) return;
  seeded = true;
  const db = getDb();
  const n = (db.prepare("select count(*) n from projects").get() as { n: number }).n;
  if (n > 0) return;
  const ins = db.prepare(
    "insert into projects (id, slug, name, tagline, description, tech, thumbnail, start, end, status, role, highlights, links, position, created_at) values (@id, @slug, @name, @tagline, @description, @tech, @thumbnail, @start, @end, @status, @role, @highlights, @links, @position, @created_at)",
  );
  db.transaction(() => {
    seed.forEach((p, i) =>
      ins.run({ id: uid(), slug: p.slug, name: p.name, tagline: p.tagline, description: p.description, tech: JSON.stringify(p.tech), thumbnail: p.thumbnail, start: p.start, end: p.end ?? null, status: p.status, role: p.role, highlights: JSON.stringify(p.highlights ?? []), links: JSON.stringify(p.links), position: i, created_at: new Date().toISOString() }),
    );
  })();
}

export function listProjects(): ProjectRow[] {
  ensureSeed();
  return (getDb().prepare("select * from projects order by position asc, created_at asc").all() as Row[]).map(toProject);
}

export function getProject(id: string): ProjectRow | null {
  ensureSeed();
  const r = getDb().prepare("select * from projects where id = ?").get(id) as Row | undefined;
  return r ? toProject(r) : null;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "project";

export type ProjectInput = Omit<Project, "slug"> & { slug?: string };

/** creates (no id) or updates (id) a project; the slug is derived from the name unless given and kept unique */
export function saveProject(input: ProjectInput, id?: string): ProjectRow {
  ensureSeed();
  const db = getDb();
  let slug = slugify(input.slug || input.name);
  const clash = db.prepare("select id from projects where slug = ? and id != ?").get(slug, id ?? "") as { id: string } | undefined;
  if (clash) slug = `${slug}-${uid().slice(-4)}`;
  const data = {
    slug,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    tech: JSON.stringify(input.tech),
    thumbnail: input.thumbnail,
    start: input.start,
    end: input.end ?? null,
    status: input.status,
    role: input.role,
    highlights: JSON.stringify(input.highlights ?? []),
    links: JSON.stringify(input.links),
  };
  if (id && getProject(id)) {
    db.prepare("update projects set slug=@slug, name=@name, tagline=@tagline, description=@description, tech=@tech, thumbnail=@thumbnail, start=@start, end=@end, status=@status, role=@role, highlights=@highlights, links=@links where id=@id").run({ ...data, id });
    return getProject(id)!;
  }
  const newId = uid();
  const position = ((db.prepare("select max(position) m from projects").get() as { m: number | null }).m ?? -1) + 1;
  db.prepare(
    "insert into projects (id, slug, name, tagline, description, tech, thumbnail, start, end, status, role, highlights, links, position, created_at) values (@id, @slug, @name, @tagline, @description, @tech, @thumbnail, @start, @end, @status, @role, @highlights, @links, @position, @created_at)",
  ).run({ ...data, id: newId, position, created_at: new Date().toISOString() });
  return getProject(newId)!;
}

export function deleteProject(id: string) {
  getDb().prepare("delete from projects where id = ?").run(id);
}

export function moveProject(id: string, dir: -1 | 1) {
  const list = listProjects();
  const i = list.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  const db = getDb();
  const set = db.prepare("update projects set position = ? where id = ?");
  db.transaction(() => {
    list.forEach((p, k) => set.run(k, p.id)); // normalise first
    set.run(j, list[i].id);
    set.run(i, list[j].id);
  })();
}
