/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listGallery } from "@/lib/store";
import { buildTree, folderHref, isHidden, itemsIn, listFolders, publicRoots, resolvePath, trail, type FolderNode } from "@/lib/gallery";
import { Gallery, type ItemFolder } from "@/components/gallery/Gallery";
import { FolderTree, type TreeNode } from "@/components/gallery/FolderTree";
import { FolderGlyph } from "@/components/gallery/FolderGlyph";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ path?: string[] }> };

async function load(segments: string[]) {
  const items = await listGallery();
  const tree = buildTree(listFolders(), items);
  const current = segments.length ? resolvePath(tree, segments.map((s) => decodeURIComponent(s))) : null;
  return { items, tree, current };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path = [] } = await params;
  if (!path.length) return { title: "gallery", description: "photos and videos i took, sorted into folders. mostly the bike, sometimes concerts and other stuff." };
  const { tree, current } = await load(path);
  if (!current) return { title: "gallery" };
  const names = trail(tree, current).map((n) => n.name);
  return {
    title: `gallery — ${names.join(" / ")}`,
    description: `${current.count} ${current.count === 1 ? "photo" : "photos and videos"} in ${names.join(" / ")}.`,
    ...(isHidden(tree, current) ? { robots: { index: false, follow: false } } : {}),
  };
}

const toTree = (nodes: FolderNode[]): TreeNode[] =>
  nodes.map((n) => ({ id: n.id, name: n.name, icon: n.icon, href: folderHref(n), count: n.count, exclusive: n.exclusive, unlisted: n.unlisted, children: toTree(n.children) }));

export default async function GalleryPage({ params }: Props) {
  const { path = [] } = await params;
  const { items, tree, current } = await load(path);
  if (path.length && !current) notFound();

  const shown = itemsIn(tree, items, current);
  const crumbs = trail(tree, current);
  const roots = publicRoots(tree, current);
  // the subfolders to show as tiles: children of the open folder, without unlisted ones
  const subfolders = (current ? (tree.byId.get(current.id)?.children ?? []) : tree.roots).filter((n) => !n.unlisted);
  const folders: Record<string, ItemFolder> = Object.fromEntries(tree.all.map((n) => [n.id, { name: trail(tree, n).map((t) => t.name).join(" / "), href: folderHref(n) }]));
  const photos = shown.filter((i) => i.kind === "image").length;
  const videos = shown.length - photos;
  const total = itemsIn(tree, items, null).length;

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">gallery.</h2>
        <p className="text-xs text-ink-soft">photos and videos i took, sorted into folders. click to enlarge, arrow keys to flip through.</p>
      </div>

      {/* address bar */}
      <div className="address-bar text-[11px]" aria-label="you are here">
        <span className="text-ink-soft shrink-0">path:</span>
        <span className="min-w-0 flex flex-wrap items-center">
          <Link href="/gallery" className="crumb">
            C:\gallery
          </Link>
          {crumbs.map((c) => (
            <span key={c.id} className="flex items-center">
              <span className="text-ink-soft">\</span>
              <Link href={folderHref(c)} className="crumb" aria-current={c.id === current?.id ? "page" : undefined}>
                {c.slug}
              </Link>
            </span>
          ))}
        </span>
        {current && (
          <Link href={folderHref(crumbs.length > 1 ? crumbs[crumbs.length - 2] : null)} className="btn text-[10px] ml-auto shrink-0" aria-label="up one folder">
            ↑ up
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[210px_minmax(0,1fr)] items-start">
        {/* folder tree: always open on wide screens, folded on phones */}
        <aside className="win win-dashed min-w-0 md:sticky md:top-6">
          <details className="gallery-tree" open>
            <summary className="win-title cursor-pointer select-none">
              <span className="dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="flex-1">folders</span>
            </summary>
            <div className="win-body !p-2 max-h-[60vh] overflow-y-auto scroll-y">
              <FolderTree roots={toTree(roots)} currentId={current?.id ?? null} openIds={crumbs.map((c) => c.id)} total={total} />
            </div>
          </details>
        </aside>

        <section className="grid gap-4 min-w-0">
          {current && (current.exclusive || current.unlisted) && (
            <p className="text-[11px] border border-dashed border-line px-3 py-2 text-ink-soft">
              {current.unlisted ? "◇ unlisted folder. you only got here with the link, so the stuff in here is a little bit just for you." : "◆ these only live in this folder. you will not find them under \"all\"."}
            </p>
          )}

          {subfolders.length > 0 && (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {subfolders.map((f) => (
                <li key={f.id} className="min-w-0">
                  <Link href={folderHref(f)} className="folder-tile group no-underline">
                    <div className="folder-cover">
                      {f.cover ? <img src={f.cover} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <span className="text-[10px] text-ink-soft">empty</span>}
                      <FolderGlyph icon={f.icon} scale={3} className="folder-glyph" />
                    </div>
                    <div className="folder-name flex items-baseline gap-1 text-[11px] min-w-0">
                      <span className="pixel text-ink truncate group-hover:text-accent">{f.name}</span>
                      <span className="text-ink-soft shrink-0">{f.count}</span>
                      {f.exclusive && (
                        <span className="text-ink-soft shrink-0" title="only shows up inside this folder">
                          ◆
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {(shown.length > 0 || subfolders.length === 0) && <Gallery key={current?.id ?? "all"} items={shown} folders={folders} showFolder={!current || current.children.length > 0} />}

          {/* status bar */}
          <div className="status-bar text-[10px] text-ink-soft">
            <span>
              {subfolders.length > 0 && `${subfolders.length} ${subfolders.length === 1 ? "folder" : "folders"} · `}
              {photos} {photos === 1 ? "photo" : "photos"}
              {videos > 0 && ` · ${videos} ${videos === 1 ? "video" : "videos"}`}
            </span>
            <span>◆ only in its folder</span>
          </div>
        </section>
      </div>
    </div>
  );
}
