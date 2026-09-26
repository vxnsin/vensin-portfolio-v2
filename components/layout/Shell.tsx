import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/data/site";
import { build } from "@/lib/build";
import { getHealth, getLatest, getSettings } from "@/lib/store";
import { getNowPlaying, spotifyConnected } from "@/lib/spotify";
import { listenStats } from "@/lib/listens";
import { SpotifyNow } from "@/components/music/SpotifyNow";
import { NavTabs } from "./NavTabs";
import { Marquee } from "./Marquee";
import { ThemeToggle } from "./ThemeToggle";
import { Window } from "./Window";
import { CycleWindow } from "./CycleWindow";
import { LanyardProvider } from "@/components/discord/LanyardProvider";
import { DiscordPresence } from "@/components/discord/DiscordPresence";
import { TodayCycle } from "@/components/widgets/TodayCycle";
import { LatestBox } from "@/components/widgets/LatestBox";
import { Typewriter } from "@/components/widgets/Typewriter";
import { Kaomoji } from "@/components/widgets/Kaomoji";

export async function Shell({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  const spotify = spotifyConnected();
  const [settings, health, latest, now] = await Promise.all([
    getSettings(),
    getHealth(),
    getLatest(),
    getNowPlaying(),
  ]);
  const lastPlayed = spotify ? listenStats().lastPlayed : null;

  return (
    <LanyardProvider>
      <div
        id="top"
        className="relative z-10 mx-auto w-full max-w-[1040px] px-4 py-6 md:py-10"
      >
        {/* header */}
        <header className="text-center mb-6">
          <Link
            href="/"
            className="no-underline hover:no-underline inline-block text-ink hover:text-accent transition-colors"
          >
            <h1 className="pixel text-3xl md:text-4xl tracking-wide">
              {site.domain}
            </h1>
          </Link>
          <div className="text-xs text-ink-soft mt-1">
            <span className="text-accent-2">{site.jpName}</span> ·{" "}
            <Typewriter words={site.typewriter} />
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px] items-start">
          {/* main column */}
          <div className="min-w-0">
            <NavTabs />
            <main className="win min-h-[420px]">
              <div className="win-body">{children}</div>
            </main>
          </div>

          {/* sidebar */}
          <aside className="grid gap-5 min-w-0 md:sticky md:top-6">
            <CycleWindow
              autoMs={15_000}
              pages={[
                {
                  key: "discord",
                  title: "discord",
                  right: <Kaomoji className="text-[11px] text-ink-soft" />,
                  node: <DiscordPresence hideSpotify={spotify} />,
                },
                ...(spotify
                  ? [
                      {
                        key: "spotify",
                        title: "spotify",
                        right: (
                          <Link
                            href="/music"
                            className="text-[10px] no-underline text-ink-soft hover:text-accent"
                          >
                            music →
                          </Link>
                        ),
                        node: (
                          <SpotifyNow
                            initial={now}
                            last={
                              lastPlayed
                                ? {
                                    song: lastPlayed.song,
                                    artist: lastPlayed.artist,
                                    art: lastPlayed.art,
                                    trackId: lastPlayed.trackId,
                                    at: lastPlayed.at,
                                  }
                                : null
                            }
                          />
                        ),
                      },
                    ]
                  : []),
              ]}
            />
            <TodayCycle health={health} />
            <Window title="latest">
              <LatestBox
                latest={latest}
                apiListening={
                  now?.playing && now.track
                    ? {
                        value: `${now.track.name} – ${now.track.artists.join(", ")}`,
                        href: now.track.url,
                      }
                    : null
                }
              />
            </Window>
          </aside>
        </div>

        {/* marquee */}
        <div className="win mt-6">
          <Marquee items={settings.marquee} />
        </div>

        {/* footer */}
        <footer className="mt-5 win win-dashed">
          <div className="win-body grid gap-3 sm:grid-cols-[1fr_auto] items-center text-xs">
            <div className="grid gap-1">
              <div className="pixel text-ink text-sm">{site.domain}</div>
              <div className="text-ink-soft">
                © {year} luis. all the bugs are mine.
              </div>
              <div className="text-ink-soft">
                hand-built with next.js, coffee and anime osts.{" "}
                <a
                  href={build.repo}
                  target="_blank"
                  rel="noreferrer"
                  title="source code"
                >
                  build {build.sha}
                </a>{" "}
                · {build.date}
              </div>
              <div className="text-ink-soft">
                status widget by{" "}
                <a
                  href="https://github.com/Phineas/lanyard"
                  target="_blank"
                  rel="noreferrer"
                >
                  lanyard
                </a>
                , posters by{" "}
                <a href="https://kitsu.app" target="_blank" rel="noreferrer">
                  kitsu
                </a>
                , pixel icons by{" "}
                <a
                  href="https://pixelarticons.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  pixelarticons
                </a>{" "}
                and{" "}
                <a
                  href="https://github.com/YukiPixels/Pixel-Art-Icons"
                  target="_blank"
                  rel="noreferrer"
                >
                  yukipixels
                </a>
                . no cookies, no tracking.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Link href="/contact" className="btn text-xs no-underline">
                contact
              </Link>
              {process.env.IMPRESSUM_URL ? (
                <a
                  href={process.env.IMPRESSUM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn text-xs no-underline"
                >
                  impressum ↗
                </a>
              ) : (
                <Link href="/impressum" className="btn text-xs no-underline">
                  impressum
                </Link>
              )}
              <Link href="/privacy" className="btn text-xs no-underline">
                privacy
              </Link>
              <ThemeToggle />
              <a
                href="#top"
                className="btn text-xs no-underline"
                aria-label="back to top"
              >
                ↑ top
              </a>
            </div>
          </div>
        </footer>
      </div>
    </LanyardProvider>
  );
}
