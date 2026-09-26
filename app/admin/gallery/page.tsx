/* eslint-disable @next/next/no-img-element */
import { requireAdmin } from "@/lib/auth";
import { listGalleryFresh } from "@/lib/store";
import { deleteGalleryAction } from "../actions";
import { UploadForm } from "./UploadForm";
import { Window } from "@/components/layout/Window";

export const dynamic = "force-dynamic";

export default async function AdminGallery() {
  await requireAdmin();
  const items = await listGalleryFresh();
  const tags = Array.from(new Set(items.map((i) => i.tag)));

  return (
    <div className="grid gap-4">
      <Window title="upload" dashed>
        <UploadForm tags={tags} />
      </Window>

      <h2 className="pixel text-accent">gallery ({items.length})</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((it) => (
          <li key={it.id} className="text-[11px]">
            <div className="aspect-square border border-line bg-paper-2 overflow-hidden relative">
              {it.kind === "video" ? (
                <video src={it.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
              ) : (
                <img src={it.url} alt={it.caption} className="w-full h-full object-cover" />
              )}
              {it.kind === "video" && <span className="absolute bottom-1 right-1 chip text-[9px] bg-paper">▶ video</span>}
            </div>
            <div className="truncate mt-1">{it.caption || <span className="text-ink-soft">no caption</span>}</div>
            <div className="flex items-center justify-between">
              <span className="chip text-[10px]">{it.tag}</span>
              <form action={deleteGalleryAction}>
                <input type="hidden" name="id" value={it.id} />
                <button type="submit" className="text-[10px] cursor-pointer" style={{ color: "var(--dnd)" }}>
                  delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
