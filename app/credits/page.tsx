import type { Metadata } from "next";
import { Window } from "@/components/layout/Window";
import { build } from "@/lib/build";

export const metadata: Metadata = { title: "credits" };

const CREDITS = [
  { name: "lanyard", what: "the live discord status in the sidebar", url: "https://github.com/Phineas/lanyard" },
  { name: "kitsu", what: "anime posters and links", url: "https://kitsu.app" },
  { name: "pixelarticons", what: "the platform icons (MIT)", url: "https://pixelarticons.com" },
  { name: "yukipixels", what: "the steam mark and a few more pixel icons (CC BY-SA 4.0)", url: "https://github.com/YukiPixels/Pixel-Art-Icons" },
  { name: "lrclib", what: "synced lyrics on the music page", url: "https://lrclib.net" },
  { name: "open-meteo", what: "the weather widget", url: "https://open-meteo.com" },
  { name: "dotgothic16 & ibm plex mono", what: "the fonts, served from this site", url: "https://fonts.google.com" },
];

export default function CreditsPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">credits.</h2>
        <p className="text-xs text-ink-soft">hand-built with next.js, coffee and anime osts. these made it nicer:</p>
      </div>
      <Window title="thanks to" dashed>
        <ul className="grid gap-2 text-xs sm:grid-cols-2">
          {CREDITS.map((c) => (
            <li key={c.name} className="border border-dashed border-line bg-paper-2 p-2.5">
              <a href={c.url} target="_blank" rel="noreferrer" className="pixel text-ink no-underline hover:text-accent">
                {c.name} ↗
              </a>
              <div className="text-ink-soft mt-0.5">{c.what}</div>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-ink-soft mt-3">
          source:{" "}
          <a href={build.repo} target="_blank" rel="noreferrer">
            build {build.sha}
          </a>{" "}
          · {build.date}
        </p>
      </Window>
    </div>
  );
}
