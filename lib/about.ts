import { kvGet, kvSet } from "./db";

// The about page's words live in kv and are edited in /admin/about; these defaults are what a fresh site shows.

export type AboutContent = {
  intro: string[];
  learning: string;
  /** one is shown per page load, at random */
  quotes: Array<{ text: string; by: string }>;
  likes: string[];
  dislikes: string[];
  askMeAbout: string[];
};

export const DEFAULT_ABOUT: AboutContent = {
  intro: [
    "Hi, my name is Luis, online mostly known as vensin. I'm a developer from Germany. I started programming with Java because of Minecraft, and somehow never stopped. These days I mostly build things for the web with TypeScript and Next.js, and I still like running game servers on the side.",
    "Outside of code I ride my motorcycle whenever the weather allows, watch a lot of anime, listen to music basically all day, and hang out with friends. I like making things that feel a bit personal instead of another generic template. This site is one of those things.",
  ],
  learning: "how to make a website feel like a place instead of a page",
  quotes: [
    { text: "el psy kongroo", by: "steins;gate, obviously" },
    { text: "a lesson without pain is meaningless", by: "fullmetal alchemist: brotherhood" },
  ],
  likes: ["anime (obviously)", "music, all day, every day", "minecraft servers & the tech behind them", "motorcycle rides, especially at golden hour", "clean uis with a bit of personality", "late night coding sessions"],
  dislikes: ["bugs that only appear in production", "cliffhanger season finales with no s2 announced", "mondays", "servers getting nuked"],
  askMeAbout: ["next.js", "minecraft server setups", "discord bots", "which anime to watch next", "motorcycles"],
};

/** a random quote, picked fresh on every page load */
export function randomQuote(about: AboutContent): { text: string; by: string } | null {
  if (about.quotes.length === 0) return null;
  return about.quotes[Math.floor(Math.random() * about.quotes.length)];
}

const KEY = "about";

export function getAbout(): AboutContent {
  const stored = kvGet<Partial<AboutContent> & { quote?: string; quoteBy?: string }>(KEY, {});
  const merged = { ...DEFAULT_ABOUT, ...stored };
  // an older save may still hold a single quote
  if (!Array.isArray(merged.quotes) || merged.quotes.length === 0) merged.quotes = stored.quote ? [{ text: stored.quote, by: stored.quoteBy ?? "" }] : DEFAULT_ABOUT.quotes;
  return merged;
}

export function saveAbout(content: AboutContent) {
  kvSet(KEY, content);
}
