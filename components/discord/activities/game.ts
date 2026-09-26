import type { ActivityHandler } from "./types";
import { largeImage, progress, smallImage } from "./util";

// Minecraft clients show up under their own name in Discord
const MINECRAFT_CLIENTS = /^(labymod|lunar client|badlion client|feather client)/i;
export const gameLabel = (name: string) => (MINECRAFT_CLIENTS.test(name) ? `Minecraft (${name})` : name);

/** plain games and everything else of type "playing" */
export const game: ActivityHandler = {
  id: "game",
  fallback: true,
  match: (a) => a.type === 0,
  info: (a) => ({
    kind: "playing",
    icon: "🎮",
    heading: `playing ${gameLabel(a.name)}`,
    title: a.details || gameLabel(a.name),
    sub: a.state ?? null,
    sub2: a.assets?.large_text ?? null,
    image: largeImage(a),
    smallImage: smallImage(a),
    progress: progress(a),
    elapsedFrom: a.timestamps?.start ?? null,
    latest: { value: gameLabel(a.name) },
  }),
};
