import type { ActivityHandler } from "./types";
import { isPaused, largeImage, progress, smallImage } from "./util";

const EPISODE = /(season|staffel)\s*\d+.*(episode|folge)\s*\d+|s\d+\s*e\d+/i;
const ANIME_BUTTON = /watch anime|anime ansehen|watch episode|folge ansehen/i;

const shortEpisode = (t: string) => t.replace(/(?:season|staffel)\s*(\d+),?\s*(?:episode|folge)\s*(\d+)/i, "S$1 E$2");

/** the aniworld presence uses kitsu posters, so the kitsu id is right there in the image url */
const kitsuUrl = (img?: string) => {
  const id = img?.match(/media\.kitsu\.app\/anime\/(\d+)\//)?.[1];
  return id ? `https://kitsu.app/anime/${id}` : null;
};

/** AniWorld & co.: name = anime, state = episode title, large_text = "Season 3, Episode 9" */
export const anime: ActivityHandler = {
  id: "anime",
  match: (a) =>
    a.type === 3 && (EPISODE.test(a.assets?.large_text ?? "") || EPISODE.test(a.state ?? "") || (a.buttons ?? []).some((b) => ANIME_BUTTON.test(b))),
  info: (a) => {
    const episode = EPISODE.test(a.assets?.large_text ?? "") ? a.assets!.large_text! : EPISODE.test(a.state ?? "") ? a.state! : "";
    const episodeTitle = a.state && a.state !== episode && a.state !== a.name ? a.state : a.details && a.details !== a.name ? a.details : null;
    const paused = isPaused(a);
    const href = kitsuUrl(a.assets?.large_image);
    return {
      kind: "watching",
      icon: paused ? "⏸" : "▶",
      heading: paused ? "paused anime" : "watching anime",
      title: a.name,
      href,
      sub: episodeTitle,
      sub2: episode || null,
      image: largeImage(a),
      smallImage: smallImage(a),
      paused,
      progress: progress(a),
      elapsedFrom: a.timestamps?.start ?? null,
      latest: { value: `${a.name} · ${episode ? shortEpisode(episode) : "anime"}`, href },
    };
  },
};
