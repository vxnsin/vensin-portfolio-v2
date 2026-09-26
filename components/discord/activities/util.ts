import type { Activity } from "../schemas";

// PreMiD (browser presence). Some presences ship their own application id, so also look for PreMiD assets / version strings.
const PREMID_APP_ID = "463097721130188830";
const PREMID = /premid/i;

export function isPreMiD(a: Activity) {
  return (
    a.application_id === PREMID_APP_ID ||
    PREMID.test(a.assets?.large_image ?? "") ||
    PREMID.test(a.assets?.small_image ?? "") ||
    PREMID.test(a.assets?.large_text ?? "") ||
    PREMID.test(a.assets?.small_text ?? "") ||
    PREMID.test(a.state ?? "") ||
    PREMID.test(a.details ?? "")
  );
}

/** discord asset keys → real urls */
export function assetUrl(img: string | undefined, applicationId?: string): string | null {
  if (!img) return null;
  if (img.startsWith("mp:external/")) return `https://media.discordapp.net/external/${img.slice("mp:external/".length)}`;
  if (img.startsWith("mp:")) return `https://media.discordapp.net/${img.slice(3)}`;
  if (img.startsWith("spotify:")) return `https://i.scdn.co/image/${img.slice(8)}`;
  if (applicationId) return `https://cdn.discordapp.com/app-assets/${applicationId}/${img}.png`;
  return null;
}

export const largeImage = (a: Activity) => assetUrl(a.assets?.large_image, a.application_id);
export const smallImage = (a: Activity) => assetUrl(a.assets?.small_image, a.application_id);

/** PreMiD puts the playback state into the small asset text */
export function isPaused(a: Activity) {
  return /paus/i.test(a.assets?.small_text ?? "");
}

export function progress(a: Activity) {
  const s = a.timestamps?.start;
  const e = a.timestamps?.end;
  return s && e && e > s ? { start: s, end: e } : null;
}

/** strip emoji and vscord's "ᕁ" separators */
export const strip = (s: string | null | undefined) =>
  (s ?? "")
    .replace(/[\p{Extended_Pictographic}️]/gu, "")
    .replace(/ᕁ/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** "PreMiD • v2.11.1" style version lines are noise */
export const notVersionLine = (s: string | null | undefined) => (s && !/premid\s*•?\s*v?\d/i.test(s) ? s : null);
