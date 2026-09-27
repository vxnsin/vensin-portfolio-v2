import { site } from "@/data/site";
import type { Message } from "./store";
import type { GuestbookEntry } from "./guestbook";
import { kvGet, kvSet } from "./db";

// Notifications go to the owner's Discord DMs as "components v2" containers: a coloured card with text blocks,
// separators and buttons. Button clicks come back through /api/discord/interactions.

const API = "https://discord.com/api/v10";
const COMPONENTS_V2 = 1 << 15;
const COLORS = {
  pink: 0xe2789b,
  lavender: 0x8b7fd6,
  green: 0x4fc47f,
  red: 0xf23f43,
  grey: 0x9a9a9a,
};

export const discordNotifyConfigured = () =>
  Boolean(process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_WEBHOOK_URL);
export const discordButtonsConfigured = () =>
  Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_PUBLIC_KEY);
/** quiet guestbook traffic (entries that passed every filter) goes to a channel instead of your dms */
export const guestbookChannelConfigured = () =>
  Boolean(
    process.env.DISCORD_GUESTBOOK_WEBHOOK_URL ||
    (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUESTBOOK_CHANNEL_ID),
  );

export type Button =
  | {
      id: string;
      label: string;
      style: "primary" | "secondary" | "success" | "danger";
    }
  | { url: string; label: string };
/** a card: text blocks (markdown), "---" for a separator, optional buttons in one row */
export type Card = { accent: number; blocks: string[]; buttons?: Button[] };

const STYLE = { primary: 1, secondary: 2, success: 3, danger: 4 } as const;
const clip = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s;
const quote = (s: string) =>
  clip(s, 1500)
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");
const when = (iso: string) =>
  `<t:${Math.floor(new Date(iso).getTime() / 1000)}:R>`;

export function cardPayload(card: Card, opts: { interactive?: boolean } = {}) {
  const components: unknown[] = card.blocks.map((b) =>
    b === "---"
      ? { type: 14, divider: true, spacing: 1 }
      : { type: 10, content: b },
  );
  const buttons = (card.buttons ?? []).filter(
    (b) => opts.interactive !== false || "url" in b,
  );
  if (buttons.length) {
    components.push({
      type: 1,
      components: buttons.map((b) =>
        "url" in b
          ? { type: 2, style: 5, label: b.label, url: b.url }
          : { type: 2, style: STYLE[b.style], label: b.label, custom_id: b.id },
      ),
    });
  }
  return {
    flags: COMPONENTS_V2,
    components: [{ type: 17, accent_color: card.accent, components }],
  };
}

/* ---------- cards ---------- */

export function messageCard(
  m: Message,
  state: "new" | "read" | "deleted" = m.read ? "read" : "new",
): Card {
  const title =
    state === "deleted"
      ? "🗑️ message deleted"
      : state === "read"
        ? "📭 message · read"
        : "📬 new message on vensin.dev";
  const blocks = [
    `## ${title}`,
    `**${clip(m.name, 80)}** · ${clip(m.email, 120)}`,
    `-# ${when(m.createdAt)} · id ${m.id}`,
    "---",
    quote(m.message),
  ];
  const buttons: Button[] =
    state === "deleted"
      ? []
      : [
          state === "new"
            ? { id: `msg:read:${m.id}`, label: "mark read", style: "secondary" }
            : {
                id: `msg:unread:${m.id}`,
                label: "mark unread",
                style: "secondary",
              },
          { id: `msg:delete:${m.id}`, label: "delete", style: "danger" },
          { url: `${site.url}/admin/messages`, label: "inbox" },
        ];
  return {
    accent:
      state === "deleted"
        ? COLORS.grey
        : state === "read"
          ? COLORS.lavender
          : COLORS.pink,
    blocks,
    buttons,
  };
}

export function guestbookCard(
  e: GuestbookEntry,
  state: GuestbookEntry["status"] | "deleted" = e.status,
): Card {
  const title =
    state === "pending"
      ? "✒️ guestbook · needs a look"
      : state === "approved"
        ? "✒️ guestbook · on the wall"
        : state === "rejected"
          ? "✒️ guestbook · rejected"
          : "🗑️ guestbook · deleted";
  const who = e.website
    ? `**${clip(e.name, 40)}** · <${e.website}>`
    : `**${clip(e.name, 40)}**`;
  const meta = [
    when(e.createdAt),
    e.reasons.length
      ? `flagged: ${e.reasons.join(", ")}`
      : "passed every filter",
    `id ${e.id}`,
  ].join(" · ");
  const blocks = [`## ${title}`, who, `-# ${meta}`, "---", quote(e.message)];
  const buttons: Button[] = [];
  if (state === "pending")
    buttons.push(
      { id: `gb:approve:${e.id}`, label: "approve", style: "success" },
      { id: `gb:reject:${e.id}`, label: "reject", style: "danger" },
    );
  if (state === "approved")
    buttons.push({
      id: `gb:reject:${e.id}`,
      label: "take down",
      style: "danger",
    });
  if (state === "rejected")
    buttons.push({
      id: `gb:approve:${e.id}`,
      label: "approve after all",
      style: "success",
    });
  if (state !== "deleted")
    buttons.push(
      { id: `gb:delete:${e.id}`, label: "delete", style: "secondary" },
      { url: `${site.url}/admin/guestbook`, label: "guestbook admin" },
    );
  const accent =
    state === "pending"
      ? COLORS.lavender
      : state === "approved"
        ? COLORS.green
        : state === "rejected"
          ? COLORS.red
          : COLORS.grey;
  return { accent, blocks, buttons };
}

export type BlockedEntry = {
  name: string;
  message: string;
  website: string | null;
  reasons: string[];
  ip: string;
  userAgent: string;
};

/** an entry the filters threw away: no buttons, just who tried it (ip + browser) so repeat offenders are easy to spot */
export function blockedCard(b: BlockedEntry): Card {
  const who = b.website
    ? `**${clip(b.name, 40)}** · <${b.website}>`
    : `**${clip(b.name, 40)}**`;
  return {
    accent: COLORS.red,
    blocks: [
      "## 🚫 guestbook · blocked",
      who,
      `-# reason: ${b.reasons.join(", ")} · not stored, not shown`,
      `-# ip ${b.ip} · ${clip(b.userAgent || "no user agent", 200)}`,
      "---",
      quote(b.message),
    ],
  };
}

/* ---------- senders (never throw) ---------- */

export async function notifyNewMessage(m: Message): Promise<boolean> {
  return send(messageCard(m, "new"));
}

/** flagged entries need a decision, so they go to your dms; clean ones only need a glance and go to the guestbook channel (dm if none is set) */
export async function notifyGuestbook(e: GuestbookEntry): Promise<boolean> {
  const quiet = e.status === "approved" && guestbookChannelConfigured();
  return send(guestbookCard(e), quiet ? "channel" : "dm");
}

/** blocked attempts carry a plain ip, so the card is remembered and deleted again after BLOCKED_RETENTION_DAYS */
export async function notifyGuestbookBlocked(
  b: BlockedEntry,
): Promise<boolean> {
  const ref = await deliver(blockedCard(b), "channel");
  if (!ref) return false;
  const list = kvGet<StoredRef[]>(BLOCKED_KEY, []);
  list.push({ ...ref, at: Date.now() });
  kvSet(BLOCKED_KEY, list.slice(-500));
  return true;
}

/** an activity the widget has no dedicated handler for — includes the raw payload so a handler can be written */
export async function notifyUnknownActivity(
  activity: unknown,
  name: string,
): Promise<boolean> {
  const raw = JSON.stringify(activity, null, 1);
  return send(
    {
      accent: COLORS.lavender,
      blocks: [
        `## 🧩 new activity seen: ${clip(name, 80)}`,
        'the widget shows this as generic "browsing". add a handler in `components/discord/activities/` to make it pretty.',
        "---",
        "```json\n" + clip(raw, 1800) + "\n```",
      ],
    },
    "activity",
  );
}

/* ---------- retention for blocked cards ---------- */

export const BLOCKED_RETENTION_DAYS = Math.max(
  1,
  Number(process.env.BLOCKED_RETENTION_DAYS ?? 14),
);
const BLOCKED_KEY = "blocked:cards";
type Ref =
  | { via: "bot"; channel: string; id: string }
  | { via: "hook"; url: string; id: string };
type StoredRef = Ref & { at: number };

/** deletes blocked cards older than the retention period from discord (runs nightly) */
export async function purgeBlockedCards(): Promise<{
  deleted: number;
  kept: number;
}> {
  const cutoff = Date.now() - BLOCKED_RETENTION_DAYS * 86_400_000;
  const list = kvGet<StoredRef[]>(BLOCKED_KEY, []);
  const keep: StoredRef[] = [];
  let deleted = 0;
  for (const ref of list) {
    if (ref.at > cutoff) {
      keep.push(ref);
      continue;
    }
    const gone = await deleteMessage(ref);
    if (gone) deleted++;
    else keep.push(ref); // discord was unreachable: try again tomorrow
  }
  kvSet(BLOCKED_KEY, keep);
  return { deleted, kept: keep.length };
}

async function deleteMessage(ref: Ref): Promise<boolean> {
  try {
    if (ref.via === "bot") {
      const token = process.env.DISCORD_BOT_TOKEN;
      if (!token) return false;
      const res = await fetch(
        `${API}/channels/${ref.channel}/messages/${ref.id}`,
        { method: "DELETE", headers: { authorization: `Bot ${token}` } },
      );
      return res.ok || res.status === 404;
    }
    const res = await fetch(`${ref.url.split("?")[0]}/messages/${ref.id}`, {
      method: "DELETE",
    });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

/* ---------- transport ---------- */

let dmChannel: string | null = null;

async function postBot(channel: string, payload: unknown): Promise<Ref | null> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${API}/channels/${channel}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bot ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const { id } = (await res.json()) as { id: string };
    return { via: "bot", channel, id };
  } catch {
    return null;
  }
}

async function postHook(url: string, payload: unknown): Promise<Ref | null> {
  try {
    const full =
      url + (url.includes("?") ? "&" : "?") + "with_components=true&wait=true";
    const res = await fetch(full, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const { id } = (await res.json()) as { id: string };
    return { via: "hook", url, id };
  } catch {
    return null;
  }
}

async function dmChannelId(): Promise<string | null> {
  if (dmChannel) return dmChannel;
  const token = process.env.DISCORD_BOT_TOKEN;
  const owner = process.env.DISCORD_OWNER_ID ?? site.discordUserId;
  if (!token) return null;
  try {
    const ch = await fetch(`${API}/users/@me/channels`, {
      method: "POST",
      headers: {
        authorization: `Bot ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ recipient_id: owner }),
    });
    if (ch.ok) dmChannel = (await ch.json()).id;
  } catch {}
  return dmChannel;
}

type Target = "dm" | "channel" | "activity";
// where the quiet traffic goes: the guestbook channel and the "new activity seen" channel each have a bot channel id and a webhook fallback
const TARGETS: Record<
  Exclude<Target, "dm">,
  { channel: string; hook: string }
> = {
  channel: {
    channel: "DISCORD_GUESTBOOK_CHANNEL_ID",
    hook: "DISCORD_GUESTBOOK_WEBHOOK_URL",
  },
  activity: {
    channel: "DISCORD_ACTIVITY_CHANNEL_ID",
    hook: "DISCORD_ACTIVITY_WEBHOOK_URL",
  },
};

/** posts a card: bot first, webhook second (webhook cards keep only link buttons, their other buttons would be dead). Channel delivery falls back to the dm so nothing gets lost. */
async function deliver(card: Card, to: Target): Promise<Ref | null> {
  if (to !== "dm") {
    const channel = process.env[TARGETS[to].channel];
    if (channel) {
      const ref = await postBot(channel, cardPayload(card));
      if (ref) return ref;
    }
    const hook = process.env[TARGETS[to].hook];
    if (hook) {
      const ref = await postHook(
        hook,
        cardPayload(card, { interactive: false }),
      );
      if (ref) return ref;
    }
  }
  const dm = await dmChannelId();
  if (dm) {
    const ref = await postBot(dm, cardPayload(card));
    if (ref) return ref;
    dmChannel = null;
  }
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (webhook)
    return postHook(webhook, cardPayload(card, { interactive: false }));
  return null;
}

async function send(card: Card, to: Target = "dm"): Promise<boolean> {
  return (await deliver(card, to)) !== null;
}
