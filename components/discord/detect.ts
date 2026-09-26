import type { Activity } from "./schemas";

// PreMiD (browser presence for YouTube, AniWorld, …). Some presences ship their own application id,
// so also look for PreMiD assets / version strings.
const PREMID_APP_ID = "463097721130188830";
const PREMID = /premid/i;
const EPISODE = /(season|staffel)\s*\d+.*(episode|folge)\s*\d+|s\d+\s*e\d+/i;
const ANIME_BUTTON = /watch anime|anime ansehen|watch episode|folge ansehen/i;
const NOT_A_GAME = /^(discord|premid)$/i;

export function isPreMiD(a: Activity) {
  return (
    a.application_id === PREMID_APP_ID ||
    PREMID.test(a.assets?.large_image ?? "") ||
    PREMID.test(a.assets?.small_image ?? "") ||
    PREMID.test(a.state ?? "") ||
    PREMID.test(a.details ?? "")
  );
}

/** browser tab presence ("Viewing home page" etc.), never a game */
export function isBrowsing(a: Activity) {
  return a.type === 0 && (isPreMiD(a) || NOT_A_GAME.test(a.name));
}

export function isGame(a: Activity) {
  return a.type === 0 && !isBrowsing(a);
}

/** AniWorld-style: name = anime, state = episode title, large_text = "Season 3, Episode 9" */
export function isAnime(a: Activity) {
  if (a.type !== 3) return false;
  return EPISODE.test(a.assets?.large_text ?? "") || EPISODE.test(a.state ?? "") || (a.buttons ?? []).some((b) => ANIME_BUTTON.test(b));
}

export function shortEpisode(text: string) {
  return text.replace(/(?:season|staffel)\s*(\d+),?\s*(?:episode|folge)\s*(\d+)/i, "S$1 E$2");
}

/** what to show for a "watching" activity */
export function watchingInfo(a: Activity) {
  if (isAnime(a)) {
    const episode = EPISODE.test(a.assets?.large_text ?? "") ? a.assets!.large_text! : EPISODE.test(a.state ?? "") ? a.state! : "";
    const episodeTitle = a.state && a.state !== episode && a.state !== a.name ? a.state : a.details && a.details !== a.name ? a.details : null;
    return { anime: true, title: a.name, sub: episodeTitle, sub2: episode || null, service: episode ? shortEpisode(episode) : "anime" };
  }
  return {
    anime: false,
    title: a.details || a.name,
    sub: a.state ?? null,
    sub2: a.assets?.large_text && a.assets.large_text !== a.details ? a.assets.large_text : null,
    service: a.name,
  };
}
