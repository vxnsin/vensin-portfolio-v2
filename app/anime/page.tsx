import type { Metadata } from "next";
import { getAnimeLists, getFavorites, getRecentlyWatched } from "@/lib/anime";
import { AnimeShelfGrid } from "@/components/anime/AnimeShelfGrid";
import { WatchLog } from "@/components/anime/WatchLog";
import { finishedTitles, watchLogStats } from "@/lib/anime-log";
import { Window } from "@/components/layout/Window";
import { FavoritesShelf } from "@/components/anime/FavoritesShelf";

export const metadata: Metadata = { title: "anime" };
export const dynamic = "force-dynamic";

function Poster({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative aspect-[2/3] border border-line bg-paper-2 overflow-hidden">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
      ) : (
        <div className="grid place-items-center h-full text-[10px] text-ink-soft">no cover</div>
      )}
    </div>
  );
}

export default async function AnimePage() {
  const [recent, favorites, lists] = await Promise.all([getRecentlyWatched(), getFavorites(), getAnimeLists()]);
  const log = watchLogStats();
  const finished = finishedTitles();

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">anime.</h2>
        <p className="text-xs text-ink-soft">what i&apos;m watching, what i&apos;ve loved. this list will keep growing (￣▽￣)ノ</p>
      </div>

      <Window title="recently watched" dashed>
        {recent.length === 0 ? (
          <p className="text-xs text-ink-soft">
            couldn&apos;t load my watch history right now. check the discord widget, i might be watching something this very moment.
          </p>
        ) : (
          <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {recent.map((a, i) => (
              <li key={`${a.url}-${i}`} className="text-[11px]">
                <a href={a.url} target="_blank" rel="noreferrer" className="block no-underline group">
                  <div className="relative">
                    <Poster src={a.cover} alt={a.title} />
                    {(a.season || a.episode) && (
                      <span className="absolute bottom-1 left-1 chip text-[9px] px-1.5 bg-paper">
                        {a.season && `S${a.season}`} {a.episode && `E${a.episode}`}
                      </span>
                    )}
                    {finished.has(a.title) && (
                      <span className="absolute top-1 right-1 chip text-[9px] px-1.5 bg-paper text-accent" title="season finished">
                        ✓ done
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-ink group-hover:text-accent">{a.title}</div>
                  {a.genre && <div className="text-[9px] text-ink-soft truncate">{a.genre}</div>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Window>

      <Window title="watch log" dashed>
        <WatchLog stats={log} />
      </Window>

      {lists && lists.watched.length > 0 && (
        <Window title={`watched · ${lists.watched.length}`} dashed>
          <p className="text-[10px] text-ink-soft mb-2">everything i&apos;ve seen, newest first.</p>
          <AnimeShelfGrid items={lists.watched} />
        </Window>
      )}
      {lists && lists.watchlist.length > 0 && (
        <Window title={`watchlist · ${lists.watchlist.length}`} dashed>
          <p className="text-[10px] text-ink-soft mb-2">not yet watched. the backlog is a lifestyle.</p>
          <AnimeShelfGrid items={lists.watchlist} />
        </Window>
      )}

      <Window title={`all-time favorites · ${favorites.length}`} dashed>
        <FavoritesShelf items={favorites} />
        <p className="text-[10px] text-ink-soft mt-3">posters via kitsu{favorites[0]?.own ? ", ratings are mine" : ", ratings by the kitsu community"}.</p>
      </Window>
    </div>
  );
}
