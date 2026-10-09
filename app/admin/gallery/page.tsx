/* eslint-disable @next/next/no-img-element */
import { requireAdmin } from "@/lib/auth";
import { listGalleryFresh } from "@/lib/store";
import { buildTree, folderHref, listFolders, trail, type FolderNode, type GalleryTree } from "@/lib/gallery";
import { deleteFolderAction, deleteGalleryAction, moveFolderAction, updateGalleryItemAction } from "../actions";
import { UploadForm } from "./UploadForm";
import { FolderForm, FolderRow, type FolderOption } from "./FolderForm";
import { Window } from "@/components/layout/Window";

export const dynamic = "force-dynamic";

const label = (tree: GalleryTree, n: FolderNode) => trail(tree, n).map((t) => t.name).join(" / ");

/** every folder except `self` and whatever is inside it, so a folder cannot be moved into itself */
function parentOptions(tree: GalleryTree, self?: FolderNode): FolderOption[] {
  const banned = new Set<string>();
  if (self) {
    const walk = (n: FolderNode) => {
      banned.add(n.id);
      n.children.forEach(walk);
    };
    walk(self);
  }
  return tree.all.filter((n) => !banned.has(n.id)).map((n) => ({ id: n.id, label: label(tree, n) }));
}

export default async function AdminGallery() {
  await requireAdmin();
  const items = await listGalleryFresh();
  const tree = buildTree(listFolders(), items);
  const all = parentOptions(tree);
  const ownCount = (id: string | null) => items.filter((i) => i.folderId === id).length;

  return (
    <div className="grid gap-4">
      <Window title="upload" dashed>
        <UploadForm folders={all} />
      </Window>

      <Window title={`folders (${tree.all.length})`} dashed>
        <div className="grid gap-3">
          <p className="text-[11px] text-ink-soft">
            folders nest as deep as you like: concerts / 2026 / some band. <b>only here</b> keeps a folder&apos;s photos out of &quot;all&quot; and the folders above it. <b>unlisted</b> also hides it from the tree; the link still works for anyone who has it, it is not a password. deleting a folder moves its photos and subfolders one level up.
          </p>
          {tree.all.length > 0 && (
            <ul className="grid gap-1.5">
              {tree.all.map((n) => {
                const siblings = n.parentId ? (tree.byId.get(n.parentId)?.children ?? []) : tree.roots;
                const pos = siblings.findIndex((s) => s.id === n.id);
                return (
                  <FolderRow key={n.id} folder={{ id: n.id, parentId: n.parentId, name: n.name, icon: n.icon, exclusive: n.exclusive, unlisted: n.unlisted }} depth={n.depth} parents={parentOptions(tree, n)} count={ownCount(n.id)} href={folderHref(n)}>
                    <form action={moveFolderAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button type="submit" disabled={pos === 0} className="btn text-[10px] disabled:opacity-30" aria-label={`move ${n.name} up`}>
                        ↑
                      </button>
                    </form>
                    <form action={moveFolderAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button type="submit" disabled={pos === siblings.length - 1} className="btn text-[10px] disabled:opacity-30" aria-label={`move ${n.name} down`}>
                        ↓
                      </button>
                    </form>
                    <form action={deleteFolderAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className="text-[10px] cursor-pointer px-1" style={{ color: "var(--dnd)" }}>
                        delete
                      </button>
                    </form>
                  </FolderRow>
                );
              })}
            </ul>
          )}
          <div className="border-t border-dashed border-line pt-3">
            <div className="pixel text-xs text-ink mb-2">new folder</div>
            <FolderForm parents={all} />
          </div>
        </div>
      </Window>

      <h2 className="pixel text-accent">photos & videos ({items.length})</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((it) => (
          <li key={it.id} className="text-[11px] grid gap-1">
            <div className="aspect-square border border-line bg-paper-2 overflow-hidden relative">
              {it.kind === "video" ? (
                <video src={`${it.url}#t=0.1`} muted playsInline preload="metadata" className="w-full h-full object-cover" />
              ) : (
                <img src={it.url} alt={it.caption} className="w-full h-full object-cover" />
              )}
              {it.kind === "video" && <span className="absolute bottom-1 right-1 chip text-[9px] bg-paper">▶ video</span>}
            </div>
            <form action={updateGalleryItemAction} className="grid gap-1">
              <input type="hidden" name="id" value={it.id} />
              <input name="caption" defaultValue={it.caption} maxLength={120} placeholder="no caption" className="input !text-[11px] !py-1" />
              <label className="grid gap-0.5" title={it.takenAt ? "read from the file; change it if it is wrong" : "the file had no date, it sorts by upload time"}>
                <span className="text-[10px] text-ink-soft">taken {it.takenAt ? "" : "(unknown, sorted by upload)"}</span>
                <input type="datetime-local" name="takenAt" defaultValue={it.takenAt?.slice(0, 16) ?? ""} className="input !text-[11px] !py-1" />
              </label>
              <div className="flex gap-1">
                <select name="folder" defaultValue={it.folderId ?? ""} className="input !text-[11px] !py-1 min-w-0">
                  <option value="">(top level)</option>
                  {all.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn text-[10px] shrink-0">
                  save
                </button>
              </div>
            </form>
            <form action={deleteGalleryAction} className="justify-self-end">
              <input type="hidden" name="id" value={it.id} />
              <button type="submit" className="text-[10px] cursor-pointer" style={{ color: "var(--dnd)" }}>
                delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
