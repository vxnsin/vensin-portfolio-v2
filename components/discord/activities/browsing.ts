import type { ActivityHandler } from "./types";
import { isPreMiD, largeImage, notVersionLine, smallImage } from "./util";

/** any other PreMiD site (or the discord client itself): shown as "browsing", never as a game */
export const browsing: ActivityHandler = {
  id: "browsing",
  fallback: true,
  match: (a) => (a.type === 0 || a.type === 3) && (isPreMiD(a) || /^discord$/i.test(a.name)),
  info: (a) => ({
    kind: "browsing",
    icon: "🌐",
    heading: `browsing ${a.name}`,
    title: a.details || a.name,
    sub: notVersionLine(a.state),
    sub2: notVersionLine(a.assets?.large_text),
    image: largeImage(a),
    smallImage: smallImage(a),
    elapsedFrom: a.timestamps?.start ?? null,
  }),
};
