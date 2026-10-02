import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/data/site";
import { getHealth, getLatest, getSettings } from "@/lib/store";
import { getNowPlaying, spotifyConnected } from "@/lib/spotify";
import { listenStats } from "@/lib/listens";
import { SpotifyNow } from "@/components/music/SpotifyNow";
import { NavTabs } from "./NavTabs";
import { Marquee } from "./Marquee";
import { ThemeToggle } from "./ThemeToggle";
import { SeasonPicker } from "./SeasonPicker";
import { resolveSeason } from "@/lib/season";
import { serverNow } from "@/lib/time";
import { VisitorCounter } from "./VisitorCounter";
import { Pet } from "@/components/widgets/Pet";
import { kvGet } from "@/lib/db";
import { SeasonGreeting } from "./SeasonGreeting";
import { AprilFools } from "@/components/decor/AprilFools";
import { Cheats } from "@/components/decor/Cheats";
import { AwayTab } from "@/components/decor/AwayTab";
import { Window } from "./Window";
import { LanyardProvider } from "@/components/discord/LanyardProvider";
import { DiscordPresence } from "@/components/discord/DiscordPresence";
import { TodayCycle } from "@/components/widgets/TodayCycle";
import { LatestBox } from "@/components/widgets/LatestBox";
import { Typewriter } from "@/components/widgets/Typewriter";
import { Kaomoji } from "@/components/widgets/Kaomoji";
import { Wordmark } from "@/components/layout/Wordmark";
import { CookieNotice } from "./CookieNotice";
import { CookieButton } from "./CookieButton";

const FOOL_WORDS = ["a professional procrastinator", "definitely not three cats in a coat", "still loading…", "a certified nap enjoyer", "404: developer not found", "your new favourite website (allegedly)"];

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
  const { season, fallback: fallbackSeason, locked: seasonLocked } = await resolveSeason();
  const renderedAt = serverNow();

  return (
    <LanyardProvider>
      <AprilFools />
      <Cheats />
      <AwayTab />
      <CookieNotice />
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
              <Wordmark />
            </h1>
          </Link>
          <div className="text-xs text-ink-soft mt-1">
            <span className="text-accent-2">{site.jpName}</span> ·{" "}
            <Typewriter words={season === "aprilfools" ? FOOL_WORDS : site.typewriter} />
          </div>
          <SeasonGreeting initial={season} />
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
            <Window title="discord" right={<Kaomoji className="text-[11px] text-ink-soft" />}>
              <DiscordPresence hideSpotify={spotify} />
            </Window>
            {spotify && (
              <Window
                title="spotify"
                right={
                  <Link href="/music" className="text-[10px] no-underline text-ink-soft hover:text-accent">
                    music →
                  </Link>
                }
              >
                <SpotifyNow initial={now} last={lastPlayed ? { song: lastPlayed.song, artist: lastPlayed.artist, art: lastPlayed.art, trackId: lastPlayed.trackId, at: lastPlayed.at } : null} />
              </Window>
            )}
            <TodayCycle health={health} />
            <Window title="mochi" right={<Link href="/mochi" className="text-[10px] no-underline text-ink-soft hover:text-accent">clicker →</Link>}>
              <Pet initialPokes={kvGet<number>("pet:pokes", 0)} season={season} />
            </Window>
            <Window title="latest">
              <LatestBox
                now={renderedAt}
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
              <div className="pixel text-ink text-sm"><Wordmark /></div>
              <div className="text-ink-soft">© {year} luis. all the bugs are mine. no tracking. cookies only for the look and the cat.</div>
              <VisitorCounter />
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
              <CookieButton />
              <Link href="/credits" className="btn text-xs no-underline">
                credits
              </Link>
              <SeasonPicker fallback={fallbackSeason} locked={seasonLocked} />
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
