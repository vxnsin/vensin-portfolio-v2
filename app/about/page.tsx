import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/data/site";
import { techstack } from "@/data/techstack";
import { getGithubStats } from "@/lib/github";
import { Window } from "@/components/layout/Window";

export const metadata: Metadata = { title: "about" };

export default async function AboutPage() {
  const gh = await getGithubStats();
  const years = new Date().getFullYear() - site.codingSince;

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">about.</h2>
        <p className="mb-3">
          Hi, my name is Luis, online mostly known as <span className="text-accent-2">vensin</span>. I&apos;m a developer from
          Germany. I started programming with Java because of Minecraft, and somehow never stopped. These days I mostly build
          things for the web with TypeScript and Next.js, and I still like running game servers on the side.
        </p>
        <p className="mb-3">
          Outside of code I ride my motorcycle whenever the weather allows, watch a lot of anime, listen to music basically all
          day, and hang out with friends. I like making things that feel a bit personal instead of another generic template.
          This site is one of those things.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <Stat value={`${years}+`} label="years coding" />
        <Stat value={String(site.codingSince)} label="started with java" />
        <Stat value={gh ? String(gh.repos) : "?"} label="public repos" />
        <Stat value={gh ? String(gh.followers) : "?"} label="github followers" />
      </div>

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
      </Window>

      <div className="grid gap-4 sm:grid-cols-2">
        <Window title="likes" dashed bodyClassName="text-xs">
          <ul className="list-disc pl-4 grid gap-1">
            <li>anime (obviously)</li>
            <li>music, all day, every day</li>
            <li>minecraft servers &amp; the tech behind them</li>
            <li>motorcycle rides, especially at golden hour</li>
            <li>clean uis with a bit of personality</li>
            <li>late night coding sessions</li>
          </ul>
        </Window>
        <Window title="dislikes" dashed bodyClassName="text-xs">
          <ul className="list-disc pl-4 grid gap-1">
            <li>bugs that only appear in production</li>
            <li>cliffhanger season finales with no s2 announced</li>
            <li>mondays</li>
            <li>servers getting nuked</li>
          </ul>
        </Window>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="win-dashed border border-line bg-paper-2 py-2">
      <div className="pixel text-2xl text-accent-2">{value}</div>
      <div className="text-[11px] text-ink-soft">{label}</div>
    </div>
  );
}
