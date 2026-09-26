import type { ActivityHandler } from "./types";
import { isPaused, largeImage, progress, smallImage } from "./util";

/** PreMiD YouTube: details = video title, state = channel */
export const youtube: ActivityHandler = {
  id: "youtube",
  match: (a) => a.type === 3 && /^youtube/i.test(a.name),
  info: (a) => {
    const paused = isPaused(a);
    const title = a.details || a.name;
    return {
      kind: "watching",
      icon: paused ? "⏸" : "▶",
      heading: `${paused ? "paused" : "watching"} on ${a.name}`,
      title,
      sub: a.state ?? null,
      image: largeImage(a),
      smallImage: smallImage(a),
      paused,
      progress: progress(a),
      elapsedFrom: a.timestamps?.start ?? null,
      latest: { value: `${title} (${a.name})` },
    };
  },
};
