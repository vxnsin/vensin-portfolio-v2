import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site, socials } from "@/data/site";
import { techstack } from "@/data/techstack";
import { getGithubStats } from "@/lib/github";
import { getAbout, randomQuote } from "@/lib/about";
import { getLatest } from "@/lib/store";
import { getRecentlyWatched } from "@/lib/anime";
import { listProjects } from "@/lib/projects";
import { watchLogStats } from "@/lib/anime-log";
import { listenStats } from "@/lib/listens";
import { relativeTime } from "@/lib/time";
import { Window } from "@/components/layout/Window";
import { PixelIcon } from "@/components/icons/PixelIcon";

export const metadata: Metadata = { title: "about" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const about = getAbout();
  const quote = randomQuote(about);
  const [gh, latest, recent] = await Promise.all([getGithubStats(), getLatest(), getRecentlyWatched()]);
  const projects = listProjects();
  const anime = watchLogStats();
  const music = listenStats();
  const years = new Date().getFullYear() - site.codingSince;
  const items = latest.items ?? {};

  const now: Array<{ label: string; value: string; href?: string | null; at?: string }> = [];
  if (items.listening) now.push({ label: "listening", value: items.listening.value, href: items.listening.href, at: items.listening.at });
  if (recent[0]) now.push({ label: "watching", value: `${recent[0].title}${recent[0].season ? ` · S${recent[0].season}` : ""}${recent[0].episode ? ` E${recent[0].episode}` : ""}`, href: recent[0].url });
  if (items.coding) now.push({ label: "coding", value: items.coding.value, href: items.coding.href, at: items.coding.at });
  if (items.played) now.push({ label: "playing", value: items.played.value, href: items.played.href, at: items.played.at });
  now.push({ label: "learning", value: about.learning });

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">about.</h2>
        {about.intro.map((p, i) => (
          <p key={i} className="mb-3">
            {p}
          </p>
        ))}
        <p className="text-ink-soft text-xs">
          the short version: {site.tagline}. the long version is below, the live version is in the sidebar.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <Stat value={`${years}+`} label="years coding" />
        <Stat value={String(projects.length)} label="projects built" />
        <Stat value={String(anime.total)} label="anime episodes on record" />
        <Stat value={music.minutesTotal >= 60 ? `${Math.round(music.minutesTotal / 60)}h` : `${Math.round(music.minutesTotal)}m`} label="music logged" />
      </div>

      <Window title="right now" dashed bodyClassName="text-xs">
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {now.map((n) => (
            <li key={n.label} className="flex items-baseline gap-2 min-w-0">
              <span className="text-ink-soft w-16 shrink-0">{n.label}</span>
              <span className="truncate">
                {n.href ? (
                  <a href={n.href} target="_blank" rel="noreferrer">
                    {n.value}
                  </a>
                ) : (
                  n.value
                )}
                {n.at && <span className="text-ink-soft text-[10px]"> · {relativeTime(n.at)}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-ink-soft mt-2">
          fed by spotify, my watch history, github and discord. <Link href="/music">music</Link> and <Link href="/anime">anime</Link> have the long versions.
        </p>
      </Window>

      <Window title="tech stack" dashed>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {techstack.map((t) => (
            <li key={t.name} className="group relative border border-line bg-paper-2 px-2 py-1.5 flex items-center gap-2 text-xs">
              <Image src={t.icon} alt="" width={18} height={18} className="w-[18px] h-[18px]" unoptimized />
              <span className="truncate">{t.name}</span>
              <span className="ml-auto text-[10px] text-ink-soft">{new Date().getFullYear() - t.since}y</span>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-56 border border-line bg-paper p-2 text-[11px] leading-snug shadow-[var(--shadow)] group-hover:block group-focus-within:block"
              >
                <b className="text-accent">{t.level}</b> · since {t.since}
                <br />
                {t.note}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-ink-soft mt-2">
          {gh ? `${gh.repos} public repos · ${gh.followers} followers on github` : "github stats are taking a nap"}
        </p>
      </Window>

      <div className="grid gap-4 sm:grid-cols-2">
        <Window title="likes" dashed bodyClassName="text-xs">
          <ul className="list-disc pl-4 grid gap-1">
            {about.likes.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Window>
        <Window title="dislikes" dashed bodyClassName="text-xs">
          <ul className="list-disc pl-4 grid gap-1">
            {about.dislikes.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Window>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Window title="ask me about" dashed bodyClassName="text-xs">
          <div className="flex flex-wrap gap-1.5">
            {about.askMeAbout.map((a) => (
              <span key={a} className="chip">
                {a}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-ink-soft mt-2">
            <Link href="/contact">contact</Link> or <Link href="/guestbook">guestbook</Link>, whichever feels right.
          </p>
        </Window>
        <Window title="a quote" dashed bodyClassName="text-xs">
          {quote ? (
            <>
              <blockquote className="pixel text-base text-ink">&ldquo;{quote.text}&rdquo;</blockquote>
              <p className="text-ink-soft mt-1">— {quote.by || "unknown"}</p>
              {about.quotes.length > 1 && <p className="text-[10px] text-ink-soft mt-2">one of {about.quotes.length}. reload for another.</p>}
            </>
          ) : (
            <p className="text-ink-soft">no quotes yet.</p>
          )}
        </Window>
      </div>

      <Window title="find me" dashed bodyClassName="text-xs">
        <ul className="flex flex-wrap gap-2">
          {socials.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer" className="chip no-underline text-ink hover:text-accent">
                <PixelIcon name={s.id} size={14} />
                {s.label} <span className="text-ink-soft">{s.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </Window>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="win-dashed border border-line bg-paper-2 py-2 px-1 min-w-0">
      <div className="pixel text-2xl text-accent-2 truncate">{value}</div>
      <div className="text-[11px] text-ink-soft">{label}</div>
    </div>
  );
}
