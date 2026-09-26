import type { Metadata } from "next";
import { getFavorites, getRecentlyWatched } from "@/lib/anime";
import { Window } from "@/components/layout/Window";

export const metadata: Metadata = { title: "anime" };
export const revalidate = 3600;

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
  const [recent, favorites] = await Promise.all([getRecentlyWatched(), getFavorites()]);

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
                  </div>
                  <div className="mt-1 truncate text-ink group-hover:text-accent">{a.title}</div>
                  {a.genre && <div className="text-[9px] text-ink-soft truncate">{a.genre}</div>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Window>

      <Window title="all-time favorites" dashed>
        <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {favorites.map((f) => (
            <li key={f.malId} className="text-[11px]">
              <a href={f.url} target="_blank" rel="noreferrer" className="block no-underline group">
                <div className="relative">
                  <Poster src={f.cover} alt={f.title} />
                  {f.rating && <span className="absolute top-1 right-1 chip text-[9px] px-1.5 bg-paper">★ {f.rating.toFixed(1)}</span>}
                </div>
                <div className="mt-1 truncate text-ink group-hover:text-accent">{f.title}</div>
                {f.note && <div className="text-[9px] text-ink-soft italic truncate">&quot;{f.note}&quot;</div>}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-ink-soft mt-3">posters &amp; ratings via kitsu.</p>
      </Window>
    </div>
  );
}
