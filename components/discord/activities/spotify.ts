import type { ActivityHandler } from "./types";
import { largeImage, progress } from "./util";

export const spotify: ActivityHandler = {
  id: "spotify",
  match: (a) => a.type === 2 && a.name === "Spotify",
  info: (a) => {
    const song = a.details || "unknown track";
    const artist = a.state || "";
    const href = a.sync_id ? `https://open.spotify.com/track/${a.sync_id}` : null;
    return {
      kind: "listening",
      icon: "♪",
      heading: "listening on spotify",
      title: song,
      href,
      sub: artist ? `by ${artist}` : null,
      sub2: a.assets?.large_text ? `on ${a.assets.large_text}` : null,
      image: largeImage(a),
      progress: progress(a),
      latest: { value: artist ? `${song} – ${artist}` : song, href },
    };
  },
};
