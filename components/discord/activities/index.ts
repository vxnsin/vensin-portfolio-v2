import type { Activity } from "../schemas";
import type { ActivityHandler, ActivityInfo, Kind } from "./types";
import { spotify } from "./spotify";
import { coding } from "./coding";
import { anime } from "./anime";
import { youtube } from "./youtube";
import { github } from "./github";
import { browsing } from "./browsing";
import { game } from "./game";

/**
 * Activity handlers, first match wins. To support a new service:
 *   1. create activities/<name>.ts exporting an ActivityHandler (match + info)
 *   2. add it to this list above the fallbacks
 * Unknown PreMiD sites land in `browsing`; the server DMs you the raw payload once so you can add a handler.
 */
export const handlers: ActivityHandler[] = [spotify, coding, anime, youtube, github, browsing, game];

/** display order in the widget and in the "latest" box */
export const KIND_ORDER: Kind[] = ["listening", "coding", "watching", "playing", "browsing"];

/** label in the latest box: live / past */
export const KIND_LABEL: Record<Kind, { live: string; past: string }> = {
  listening: { live: "listening", past: "listened" },
  coding: { live: "coding", past: "coded" },
  watching: { live: "watching", past: "watched" },
  playing: { live: "playing", past: "played" },
  browsing: { live: "browsing", past: "browsed" },
};

export type Resolved = { activity: Activity; handler: ActivityHandler; info: ActivityInfo };

export function resolve(a: Activity): Resolved | null {
  if (a.type === 4) return null; // custom status is rendered separately
  const handler = handlers.find((h) => h.match(a));
  if (!handler) return null;
  return { activity: a, handler, info: handler.info(a) };
}

/** all renderable activities, in display order */
export function resolveAll(activities: Activity[]): Resolved[] {
  return activities
    .map(resolve)
    .filter((r): r is Resolved => r !== null)
    .sort((x, y) => KIND_ORDER.indexOf(x.info.kind) - KIND_ORDER.indexOf(y.info.kind));
}

export type { ActivityHandler, ActivityInfo, Kind } from "./types";
