import { getDb, uid } from "./db";
import type { GalleryItem } from "./store";
import { FOLDER_ICONS, type FolderIcon } from "./gallery-icons";

// Gallery folders: a tree like on a desktop. Every photo or video sits in one folder (or in the root).
// A folder's page shows its own items plus everything in its subfolders, so "outdoor" also shows "outdoor/bike/night".
// Two switches per folder:
//   only here - its items do not show up in "all" or in the parent folders, only when you open the folder (a concert, say)
//   unlisted  - same, and the folder is left out of the tree for visitors; whoever has the link can still open it

export type Folder = { id: string; parentId: string | null; slug: string; name: string; icon: FolderIcon; exclusive: boolean; unlisted: boolean; position: number; createdAt: string };

export type FolderNode = Folder & {
  path: string[]; // slugs from the root, for the url
  depth: number;
  children: FolderNode[];
  /** everything filed under this folder, "only here" subfolders included, unlisted ones not: what the tree and tiles count */
  count: number;
  cover: string | null;
};

export type GalleryTree = { roots: FolderNode[]; byId: Map<string, FolderNode>; all: FolderNode[] };

type Row = { id: string; parent_id: string | null; slug: string; name: string; icon: string; exclusive: number; unlisted: number; position: number; created_at: string };
const toFolder = (r: Row): Folder => ({
  id: r.id,
  parentId: r.parent_id,
  slug: r.slug,
  name: r.name,
  icon: (FOLDER_ICONS as readonly string[]).includes(r.icon) ? (r.icon as FolderIcon) : "folder",
  exclusive: r.exclusive === 1,
  unlisted: r.unlisted === 1,
  position: r.position,
  createdAt: r.created_at,
});

export const listFolders = (): Folder[] => (getDb().prepare("select * from gallery_folders order by position, name").all() as Row[]).map(toFolder);

/** a folder hides its items from the views above it when it is "only here" or unlisted */
const closed = (f: Folder) => f.exclusive || f.unlisted;

/** builds the tree with counts and covers. `items` should be newest first. */
export function buildTree(folders: Folder[], items: GalleryItem[]): GalleryTree {
  const byId = new Map<string, FolderNode>();
  for (const f of folders) byId.set(f.id, { ...f, path: [], depth: 0, children: [], count: 0, cover: null });
  const roots: FolderNode[] = [];
  for (const n of byId.values()) {
    const parent = n.parentId ? byId.get(n.parentId) : undefined;
    if (parent) parent.children.push(n);
    else roots.push(n);
  }
  const all: FolderNode[] = [];
  const walk = (nodes: FolderNode[], path: string[], depth: number) => {
    nodes.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    for (const n of nodes) {
      n.path = [...path, n.slug];
      n.depth = depth;
      all.push(n);
      walk(n.children, n.path, depth + 1);
    }
  };
  walk(roots, [], 0);
  const tree = { roots, byId, all };
  for (const n of all) {
    const filed = items.filter((i) => reaches(tree, i.folderId, n, (f) => f.unlisted));
    n.count = filed.length;
    // the cover prefers what the folder shows when opened, then anything filed under it
    const shown = itemsIn(tree, items, n);
    n.cover = (shown.find((i) => i.kind === "image") ?? filed.find((i) => i.kind === "image"))?.url ?? null;
  }
  return tree;
}

/** is `folderId` inside `node` (or node itself) without crossing a closed folder on the way down? */
function reaches(tree: GalleryTree, folderId: string | null, node: FolderNode | null, stop: (f: Folder) => boolean = closed): boolean {
  let cur = folderId ? tree.byId.get(folderId) : undefined;
  if (folderId && !cur) return node === null; // folder was deleted: treat as root
  while (cur) {
    if (node && cur.id === node.id) return true;
    if (stop(cur)) return false;
    cur = cur.parentId ? tree.byId.get(cur.parentId) : undefined;
  }
  return node === null;
}

/** what a view shows: `null` is "all" */
export const itemsIn = (tree: GalleryTree, items: GalleryItem[], node: FolderNode | null) => items.filter((i) => reaches(tree, i.folderId, node));

/** the folder at a url path, or null when the path does not exist */
export function resolvePath(tree: GalleryTree, segments: string[]): FolderNode | null {
  let level = tree.roots;
  let found: FolderNode | null = null;
  for (const seg of segments) {
    found = level.find((n) => n.slug === seg) ?? null;
    if (!found) return null;
    level = found.children;
  }
  return found;
}

/** the chain from the root down to `node` */
export function trail(tree: GalleryTree, node: FolderNode | null): FolderNode[] {
  const out: FolderNode[] = [];
  let cur = node;
  while (cur) {
    out.unshift(cur);
    cur = cur.parentId ? (tree.byId.get(cur.parentId) ?? null) : null;
  }
  return out;
}

/** true when the folder or one of its parents is unlisted */
export const isHidden = (tree: GalleryTree, node: FolderNode) => trail(tree, node).some((n) => n.unlisted);

/** the tree as a visitor sees it: unlisted folders are gone unless they are on the path being looked at */
export function publicRoots(tree: GalleryTree, current: FolderNode | null): FolderNode[] {
  const open = new Set(trail(tree, current).map((n) => n.id));
  const prune = (nodes: FolderNode[]): FolderNode[] => nodes.filter((n) => !n.unlisted || open.has(n.id)).map((n) => ({ ...n, children: prune(n.children) }));
  return prune(tree.roots);
}

export const folderHref = (n: FolderNode | null) => (n ? `/gallery/${n.path.map(encodeURIComponent).join("/")}` : "/gallery");

/* ---------- editing (admin) ---------- */

const UMLAUT: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => UMLAUT[c])
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "folder";

function uniqueSlug(base: string, parentId: string | null, selfId?: string) {
  const taken = new Set(
    (getDb().prepare("select slug, id from gallery_folders where coalesce(parent_id, '') = ?").all(parentId ?? "") as Array<{ slug: string; id: string }>)
      .filter((r) => r.id !== selfId)
      .map((r) => r.slug),
  );
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

export type FolderInput = { id?: string; parentId: string | null; name: string; icon: string; exclusive: boolean; unlisted: boolean };

export function saveFolder(input: FolderInput): { ok: true; id: string } | { ok: false; error: string } {
  const name = input.name.trim().slice(0, 40);
  if (!name) return { ok: false, error: "give the folder a name" };
  const icon = (FOLDER_ICONS as readonly string[]).includes(input.icon) ? input.icon : "folder";
  const folders = listFolders();
  const parentId = input.parentId && folders.some((f) => f.id === input.parentId) ? input.parentId : null;
  if (input.id) {
    // a folder cannot move into itself or into one of its own subfolders
    for (let cur: string | null = parentId; cur; cur = folders.find((f) => f.id === cur)?.parentId ?? null) {
      if (cur === input.id) return { ok: false, error: "a folder cannot go inside itself" };
    }
    const slug = uniqueSlug(slugify(name), parentId, input.id);
    getDb()
      .prepare("update gallery_folders set parent_id = ?, slug = ?, name = ?, icon = ?, exclusive = ?, unlisted = ? where id = ?")
      .run(parentId, slug, name, icon, input.exclusive ? 1 : 0, input.unlisted ? 1 : 0, input.id);
    return { ok: true, id: input.id };
  }
  const id = uid();
  const position = folders.filter((f) => f.parentId === parentId).length;
  getDb()
    .prepare("insert into gallery_folders (id, parent_id, slug, name, icon, exclusive, unlisted, position, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, parentId, uniqueSlug(slugify(name), parentId), name, icon, input.exclusive ? 1 : 0, input.unlisted ? 1 : 0, position, new Date().toISOString());
  return { ok: true, id };
}

/** deletes a folder; its photos and subfolders move up one level, nothing is lost */
export function deleteFolder(id: string) {
  const db = getDb();
  const f = db.prepare("select * from gallery_folders where id = ?").get(id) as Row | undefined;
  if (!f) return;
  db.transaction(() => {
    db.prepare("update gallery set folder_id = ? where folder_id = ?").run(f.parent_id, id);
    for (const child of db.prepare("select id, slug from gallery_folders where parent_id = ?").all(id) as Array<{ id: string; slug: string }>) {
      db.prepare("update gallery_folders set parent_id = ?, slug = ? where id = ?").run(f.parent_id, uniqueSlug(child.slug, f.parent_id, child.id), child.id);
    }
    db.prepare("delete from gallery_folders where id = ?").run(id);
  })();
}

/** swaps a folder with its neighbour among its siblings */
export function moveFolder(id: string, dir: -1 | 1) {
  const f = listFolders().find((x) => x.id === id);
  if (!f) return;
  const siblings = listFolders().filter((x) => x.parentId === f.parentId);
  const i = siblings.findIndex((x) => x.id === id);
  const j = i + dir;
  if (j < 0 || j >= siblings.length) return;
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  const stmt = getDb().prepare("update gallery_folders set position = ? where id = ?");
  getDb().transaction(() => siblings.forEach((s, k) => stmt.run(k, s.id)))();
}

export function setItemFolder(itemId: string, folderId: string | null) {
  const exists = folderId ? getDb().prepare("select 1 from gallery_folders where id = ?").get(folderId) : true;
  getDb().prepare("update gallery set folder_id = ? where id = ?").run(exists ? folderId : null, itemId);
}

export function setItemCaption(itemId: string, caption: string) {
  getDb().prepare("update gallery set caption = ? where id = ?").run(caption.trim().slice(0, 120), itemId);
}
