/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listGalleryFresh, type GalleryItem } from "@/lib/store";
import { buildTree, folderHref, listFolders, thumbOf, trail, type FolderNode, type GalleryTree } from "@/lib/gallery";
import { ffmpegAvailable, kickVideoQueue } from "@/lib/video";
import { bulkGalleryAction, deleteFolderAction, deleteGalleryAction, moveFolderAction, retryVideoAction, setFolderCoverAction, updateGalleryItemAction } from "../actions";
import { UploadForm } from "./UploadForm";
import { FolderForm, FolderRow, type FolderOption } from "./FolderForm";
import { SelectAll } from "./SelectAll";
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

const STATUS: Record<string, { text: string; tone?: "ok" | "bad" }> = {
  pending: { text: "waiting for its web copy" },
  working: { text: "making the web copy…" },
  done: { text: "web copy ready", tone: "ok" },
  skipped: { text: "plays as it is", tone: "ok" },
  failed: { text: "web copy failed", tone: "bad" },
  "no-ffmpeg": { text: "no web copy (ffmpeg missing)", tone: "bad" },
};

type Props = { searchParams: Promise<{ folder?: string }> };

export default async function AdminGallery({ searchParams }: Props) {
  await requireAdmin();
  const { folder: pick = "" } = await searchParams;
  const items = await listGalleryFresh();
  const tree = buildTree(listFolders(), items);
  const all = parentOptions(tree);
  const ownCount = (id: string | null) => items.filter((i) => i.folderId === id).length;

  // which items the list at the bottom shows: one folder's own items, the top level, or everything
  const selected = pick && pick !== "top" && pick !== "all" ? (tree.byId.get(pick) ?? null) : null;
  const scope = selected ? "folder" : pick === "top" ? "top" : "all";
  const shown: GalleryItem[] = scope === "folder" ? items.filter((i) => i.folderId === selected!.id) : scope === "top" ? items.filter((i) => !i.folderId || !tree.byId.has(i.folderId)) : items;
  const scopeName = scope === "folder" ? label(tree, selected!) : scope === "top" ? "top level (no folder)" : "everything";

  const videos = items.filter((i) => i.kind === "video");
  const ffmpeg = videos.length ? ffmpegAvailable() : true;
  if (videos.some((v) => v.webStatus === "pending" || v.webStatus === null)) kickVideoQueue();
  const converting = videos.filter((v) => v.webStatus === "pending" || v.webStatus === "working").length;

  return (
    <div className="grid gap-4">
      {!ffmpeg && (
        <div className="border border-dashed px-3 py-2 text-[11px] grid gap-1" style={{ borderColor: "var(--dnd)" }}>
          <span>
            <b>ffmpeg is missing on this server.</b> videos still work, but without stills (folders look empty) and without the light web copy, so big phone videos load slowly. on the pi:
          </span>
          <code className="bg-paper-2 px-2 py-1 w-fit">sudo apt install ffmpeg</code>
          <span className="text-ink-soft">within ten minutes the site notices and works through all videos by itself.</span>
        </div>
      )}
      {ffmpeg && converting > 0 && (
        <p className="text-[11px] text-ink-soft border border-dashed border-line px-3 py-2">
          ⧗ {converting} {converting === 1 ? "video is" : "videos are"} being made web-friendly in the background, one after another. that can take a while on the pi; the site keeps working meanwhile. reload to see the progress.
        </p>
      )}

      <Window title="upload" dashed>
        <UploadForm folders={all} defaultFolder={selected?.id} />
      </Window>

      <Window title={`folders (${tree.all.length})`} dashed>
        <div className="grid gap-3">
          <p className="text-[11px] text-ink-soft">
            click a folder&apos;s name to manage what is in it, further down. folders nest as deep as you like. <b>only here</b> keeps a folder&apos;s photos out of &quot;all&quot; and the folders above it. <b>unlisted</b> also hides it from the tree; the link still works for anyone who has it, it is not a password. deleting a folder moves its photos and subfolders one level up.
          </p>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <Link href="/admin/gallery?folder=all#items" className="chip no-underline" style={scope === "all" ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}>
              everything ({items.length})
            </Link>
            <Link href="/admin/gallery?folder=top#items" className="chip no-underline" style={scope === "top" ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}>
              top level ({ownCount(null)})
            </Link>
          </div>
          {tree.all.length > 0 && (
            <ul className="grid gap-1.5">
              {tree.all.map((n) => {
                const siblings = n.parentId ? (tree.byId.get(n.parentId)?.children ?? []) : tree.roots;
                const pos = siblings.findIndex((s) => s.id === n.id);
                return (
                  <FolderRow
                    key={n.id}
                    folder={{ id: n.id, parentId: n.parentId, name: n.name, icon: n.icon, exclusive: n.exclusive, unlisted: n.unlisted }}
                    depth={n.depth}
                    parents={parentOptions(tree, n)}
                    count={ownCount(n.id)}
                    href={folderHref(n)}
                    manageHref={`/admin/gallery?folder=${n.id}#items`}
                    selected={selected?.id === n.id}
                  >
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
            <FolderForm parents={all} folder={selected ? { parentId: selected.id, name: "", icon: "folder", exclusive: false, unlisted: false } : undefined} />
          </div>
        </div>
      </Window>

      <section id="items" className="grid gap-3 scroll-mt-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="pixel text-accent">{scopeName}</h2>
          <span className="text-[11px] text-ink-soft">
            {shown.length} {shown.length === 1 ? "item" : "items"}
            {selected && selected.children.length > 0 && ` · subfolders are managed on their own`}
          </span>
          {selected && (
            <a href={folderHref(selected)} target="_blank" rel="noreferrer" className="text-[11px] ml-auto">
              open public page ↗
            </a>
          )}
        </div>

        {selected && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-soft">
            <span>cover:</span>
            {selected.coverId ? <span className="text-ink">picked by hand</span> : <span>automatic (the first photo or video still)</span>}
            {selected.coverId && (
              <form action={setFolderCoverAction}>
                <input type="hidden" name="folder" value={selected.id} />
                <input type="hidden" name="item" value="auto" />
                <button type="submit" className="btn text-[10px]">
                  back to automatic
                </button>
              </form>
            )}
          </div>
        )}

        {shown.length > 0 && (
          <form id="bulk" action={bulkGalleryAction} className="flex flex-wrap items-center gap-2 border border-dashed border-line px-2 py-1.5 text-[11px]">
            <SelectAll form="bulk" />
            <span className="text-ink-soft">selected:</span>
            <select name="folder" className="input !w-auto !text-[11px] !py-1 max-w-[240px]" defaultValue={selected?.id ?? ""}>
              <option value="">(top level)</option>
              {all.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <button type="submit" name="op" value="move" className="btn text-[10px]">
              move there
            </button>
            <button type="submit" name="op" value="delete" className="text-[10px] cursor-pointer px-1 ml-auto" style={{ color: "var(--dnd)" }}>
              delete selected
            </button>
          </form>
        )}

        {shown.length === 0 && <p className="text-[11px] text-ink-soft border border-dashed border-line p-4 text-center">nothing in here. upload something above, the folder is already picked.</p>}

        <ul className="grid gap-2">
          {shown.map((it) => {
            const st = it.kind === "video" && it.webStatus ? STATUS[it.webStatus] : null;
            const isCover = !!selected && selected.coverId === it.id;
            return (
              <li key={it.id} className="gallery-row border border-line bg-paper-2 p-2 text-[11px]">
                <input type="checkbox" name="ids" value={it.id} form="bulk" aria-label={`select ${it.title || it.caption || it.kind}`} className="self-start mt-1" />
                <a href={it.webUrl ?? it.url} target="_blank" rel="noreferrer" className="gallery-row-thumb relative block border border-line bg-paper overflow-hidden">
                  {thumbOf(it) ? (
                    <img src={thumbOf(it)!} alt="" loading="lazy" className="w-full h-full object-cover" />
                  ) : it.kind === "video" ? (
                    <video src={`${it.url}#t=0.1`} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                  ) : null}
                  {it.kind === "video" && <span className="absolute left-1 bottom-1 chip text-[9px] bg-paper">▶</span>}
                  {isCover && <span className="absolute right-1 top-1 chip text-[9px] bg-paper">★ cover</span>}
                </a>
                <form action={updateGalleryItemAction} className="grid gap-1.5 min-w-0 sm:grid-cols-2">
                  <input type="hidden" name="id" value={it.id} />
                  <label className="grid gap-0.5 min-w-0">
                    <span className="text-[10px] text-ink-soft">title</span>
                    <input name="title" defaultValue={it.title} maxLength={80} placeholder="no title" className="input !text-[11px] !py-1" />
                  </label>
                  <label className="grid gap-0.5 min-w-0">
                    <span className="text-[10px] text-ink-soft">taken {it.takenAt ? "" : "(unknown, sorted by upload)"}</span>
                    <input type="datetime-local" name="takenAt" defaultValue={it.takenAt?.slice(0, 16) ?? ""} className="input !text-[11px] !py-1" />
                  </label>
                  <label className="grid gap-0.5 min-w-0 sm:col-span-2">
                    <span className="text-[10px] text-ink-soft">caption (shown under it when it is opened)</span>
                    <textarea name="caption" defaultValue={it.caption} maxLength={500} rows={2} placeholder="no caption" className="input !text-[11px] !py-1 !min-h-0" />
                  </label>
                  <label className="grid gap-0.5 min-w-0">
                    <span className="text-[10px] text-ink-soft">folder</span>
                    <select name="folder" defaultValue={it.folderId ?? ""} className="input !text-[11px] !py-1 w-full min-w-0">
                      <option value="">(top level)</option>
                      {all.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-end gap-1.5">
                    <button type="submit" className="btn text-[10px]">
                      save
                    </button>
                    {st && (
                      <span className="text-[10px] truncate" style={st.tone === "ok" ? { color: "var(--ok)" } : st.tone === "bad" ? { color: "var(--dnd)" } : { color: "var(--ink-soft)" }}>
                        {st.text}
                      </span>
                    )}
                  </div>
                </form>
                <div className="gallery-row-side grid gap-1 content-start">
                  {selected && !isCover && (
                    <form action={setFolderCoverAction}>
                      <input type="hidden" name="folder" value={selected.id} />
                      <input type="hidden" name="item" value={it.id} />
                      <button type="submit" className="btn text-[10px] w-full" title="use this as the folder's cover">
                        ★ cover
                      </button>
                    </form>
                  )}
                  {it.kind === "video" && (it.webStatus === "failed" || it.webStatus === "no-ffmpeg") && (
                    <form action={retryVideoAction}>
                      <input type="hidden" name="id" value={it.id} />
                      <button type="submit" className="btn text-[10px] w-full">
                        retry
                      </button>
                    </form>
                  )}
                  <form action={deleteGalleryAction}>
                    <input type="hidden" name="id" value={it.id} />
                    <button type="submit" className="text-[10px] cursor-pointer w-full text-right" style={{ color: "var(--dnd)" }}>
                      delete
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
