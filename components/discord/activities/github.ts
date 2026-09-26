import type { ActivityHandler } from "./types";
import { isPreMiD, largeImage, notVersionLine, smallImage } from "./util";

/** PreMiD GitHub: details = "Viewing vxnsin's profile" / "Viewing repo …" */
export const github: ActivityHandler = {
  id: "github",
  match: (a) => a.name === "GitHub" && isPreMiD(a),
  info: (a) => {
    const details = a.details ?? "";
    const user = details.match(/viewing (\S+?)'s profile/i)?.[1];
    const repo = details.match(/(?:viewing|browsing)\s+(?:repo(?:sitory)?\s+)?([\w.-]+\/[\w.-]+)/i)?.[1];
    const href = user ? `https://github.com/${user}` : repo ? `https://github.com/${repo}` : null;
    return {
      kind: "browsing",
      icon: "⌥",
      heading: "browsing github",
      title: details || "github",
      href,
      sub: notVersionLine(a.state),
      sub2: notVersionLine(a.assets?.large_text),
      image: largeImage(a),
      smallImage: smallImage(a),
      elapsedFrom: a.timestamps?.start ?? null,
    };
  },
};
