import type { Activity } from "../schemas";

/** which "latest" slot an activity feeds; also decides the display order in the widget */
export type Kind = "listening" | "coding" | "watching" | "playing" | "browsing";

export type ActivityInfo = {
  kind: Kind;
  icon: string; // emoji in the heading
  heading: string; // "listening on spotify", "watching anime", …
  title: string;
  href?: string | null; // makes the title clickable
  sub?: string | null;
  sub2?: string | null;
  image?: string | null; // 44px thumbnail
  smallImage?: string | null; // badge on the thumbnail corner
  paused?: boolean;
  progress?: { start: number; end: number } | null; // progress bar
  elapsedFrom?: number | null; // "x elapsed" timer when there is no end
  /** what the "latest" box remembers; leave undefined to not track this activity */
  latest?: { value: string; href?: string | null } | null;
};

export type ActivityHandler = {
  id: string;
  /** fallbacks (game, browsing) are "unknown" — the server pings you on discord when one shows up */
  fallback?: boolean;
  match: (a: Activity) => boolean;
  info: (a: Activity) => ActivityInfo;
};
