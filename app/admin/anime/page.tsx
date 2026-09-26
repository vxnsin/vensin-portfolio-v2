/* eslint-disable @next/next/no-img-element */
import { requireAdmin } from "@/lib/auth";
import { listFavoritesFresh } from "@/lib/store";
import { deleteFavoriteAction, moveFavoriteAction, updateFavoriteAction } from "../actions";
import { AddFavorite } from "./AddFavorite";
import { Window } from "@/components/layout/Window";

export const dynamic = "force-dynamic";

export default async function AdminAnime() {
  await requireAdmin();
  const favorites = await listFavoritesFresh();

  return (
    <div className="grid gap-4">
      <Window title="add a favorite" dashed>
        <AddFavorite />
      </Window>

      <h2 className="pixel text-accent">all-time favorites ({favorites.length})</h2>
      {favorites.length === 0 && <p className="text-xs text-ink-soft">empty. the anime page shows the seed list from data/anime.ts until you add something here.</p>}
      <ul className="grid gap-2">
        {favorites.map((f, i) => (
          <li key={f.id} className="win win-dashed">
            <div className="flex gap-3 p-2 text-xs items-start">
              <div className="w-12 aspect-[2/3] border border-line bg-paper-2 overflow-hidden shrink-0">
                {f.poster && <img src={f.poster} alt="" className="w-full h-full object-cover" />}
              </div>
              <form action={updateFavoriteAction} className="flex-1 min-w-0 grid gap-1.5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <input type="hidden" name="id" value={f.id} />
                <div className="sm:col-span-3 flex items-center gap-2 min-w-0">
                  <span className="pixel text-sm truncate">{f.title}</span>
                  <a href={`https://kitsu.app/anime/${f.slug || f.kitsuId}`} target="_blank" rel="noreferrer" className="text-[10px]">
                    kitsu ↗
                  </a>
                </div>
                <label className="grid gap-0.5">
                  <span className="text-ink-soft">note</span>
                  <input name="note" defaultValue={f.note} maxLength={80} className="input" />
                </label>
                <label className="grid gap-0.5">
                  <span className="text-ink-soft">rating</span>
                  <select name="rating" defaultValue={f.rating} className="input">
                    {Array.from({ length: 10 }, (_, n) => 10 - n).map((n) => (
                      <option key={n} value={n}>
                        {n}/10
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn text-[11px]">
                  save
                </button>
              </form>
              <div className="flex flex-col gap-1 shrink-0">
                <form action={moveFavoriteAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" disabled={i === 0} className="btn text-[11px] disabled:opacity-40" aria-label="move up">
                    ↑
                  </button>
                </form>
                <form action={moveFavoriteAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" disabled={i === favorites.length - 1} className="btn text-[11px] disabled:opacity-40" aria-label="move down">
                    ↓
                  </button>
                </form>
                <form action={deleteFavoriteAction}>
                  <input type="hidden" name="id" value={f.id} />
                  <button type="submit" className="btn text-[11px]" style={{ color: "var(--dnd)" }} aria-label="delete">
                    ✕
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
