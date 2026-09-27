import { getDb, uid } from "./db";

// The /setup page: what's on the desk, in the bag and in the garage. Edited in /admin/setup, stored in sqlite.

import { SETUP_CATEGORIES, type SetupItem } from "./setup-data";
export * from "./setup-data";
type Row = { id: string; category: string; name: string; note: string; url: string | null; image: string | null; position: number };

const toItem = (r: Row): SetupItem => ({ id: r.id, category: r.category, name: r.name, note: r.note, url: r.url, image: r.image, position: r.position });

export function listSetup(): SetupItem[] {
  return (getDb().prepare("select * from setup_items order by position asc, created_at asc").all() as Row[]).map(toItem);
}

export function getSetupItem(id: string): SetupItem | null {
  const r = getDb().prepare("select * from setup_items where id = ?").get(id) as Row | undefined;
  return r ? toItem(r) : null;
}

/** items grouped by category, categories in the order of SETUP_CATEGORIES (unknown ones last) */
export function groupedSetup(): Array<{ category: string; items: SetupItem[] }> {
  const items = listSetup();
  const order = (c: string) => {
    const i = (SETUP_CATEGORIES as readonly string[]).indexOf(c);
    return i < 0 ? 99 : i;
  };
  const cats = [...new Set(items.map((i) => i.category))].sort((a, b) => order(a) - order(b));
  return cats.map((category) => ({ category, items: items.filter((i) => i.category === category) }));
}

export function saveSetupItem(input: Omit<SetupItem, "id" | "position">, id?: string): SetupItem {
  const db = getDb();
  if (id && getSetupItem(id)) {
    db.prepare("update setup_items set category=@category, name=@name, note=@note, url=@url, image=@image where id=@id").run({ ...input, id });
    return getSetupItem(id)!;
  }
  const newId = uid();
  const position = ((db.prepare("select max(position) m from setup_items").get() as { m: number | null }).m ?? -1) + 1;
  db.prepare("insert into setup_items (id, category, name, note, url, image, position, created_at) values (@id, @category, @name, @note, @url, @image, @position, @created_at)").run({ ...input, id: newId, position, created_at: new Date().toISOString() });
  return getSetupItem(newId)!;
}

export function deleteSetupItem(id: string) {
  getDb().prepare("delete from setup_items where id = ?").run(id);
}

export function moveSetupItem(id: string, dir: -1 | 1) {
  const list = listSetup();
  const i = list.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  const db = getDb();
  const set = db.prepare("update setup_items set position = ? where id = ?");
  db.transaction(() => {
    list.forEach((p, k) => set.run(k, p.id));
    set.run(j, list[i].id);
    set.run(i, list[j].id);
  })();
}
