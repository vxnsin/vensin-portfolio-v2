import { site } from "@/data/site";
import type { Message } from "./store";
import type { GuestbookEntry } from "./guestbook";

// Notifications go to the owner's Discord DMs as "components v2" containers: a coloured card with text blocks,
// separators and buttons. Button clicks come back through /api/discord/interactions.

const API = "https://discord.com/api/v10";
const COMPONENTS_V2 = 1 << 15;
const COLORS = { pink: 0xe2789b, lavender: 0x8b7fd6, green: 0x4fc47f, red: 0xf23f43, grey: 0x9a9a9a };

export const discordNotifyConfigured = () => Boolean(process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_WEBHOOK_URL);
export const discordButtonsConfigured = () => Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_PUBLIC_KEY);
/** quiet guestbook traffic (entries that passed every filter) goes to a channel instead of your dms */
export const guestbookChannelConfigured = () => Boolean(process.env.DISCORD_GUESTBOOK_WEBHOOK_URL || (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUESTBOOK_CHANNEL_ID));

export type Button = { id: string; label: string; style: "primary" | "secondary" | "success" | "danger" } | { url: string; label: string };
/** a card: text blocks (markdown), "---" for a separator, optional buttons in one row */
export type Card = { accent: number; blocks: string[]; buttons?: Button[] };

const STYLE = { primary: 1, secondary: 2, success: 3, danger: 4 } as const;
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const quote = (s: string) => clip(s, 1500).split("\n").map((l) => `> ${l}`).join("\n");
const when = (iso: string) => `<t:${Math.floor(new Date(iso).getTime() / 1000)}:R>`;

export function cardPayload(card: Card, opts: { interactive?: boolean } = {}) {
  const components: unknown[] = card.blocks.map((b) => (b === "---" ? { type: 14, divider: true, spacing: 1 } : { type: 10, content: b }));
  const buttons = (card.buttons ?? []).filter((b) => opts.interactive !== false || "url" in b);
  if (buttons.length) {
    components.push({
      type: 1,
      components: buttons.map((b) => ("url" in b ? { type: 2, style: 5, label: b.label, url: b.url } : { type: 2, style: STYLE[b.style], label: b.label, custom_id: b.id })),
    });
  }
  return { flags: COMPONENTS_V2, components: [{ type: 17, accent_color: card.accent, components }] };
}

/* ---------- cards ---------- */

export function messageCard(m: Message, state: "new" | "read" | "deleted" = m.read ? "read" : "new"): Card {
  const title = state === "deleted" ? "🗑️ message deleted" : state === "read" ? "📭 message · read" : "📬 new message on vensin.dev";
  const blocks = [`## ${title}`, `**${clip(m.name, 80)}** · ${clip(m.email, 120)}`, `-# ${when(m.createdAt)} · id ${m.id}`, "---", quote(m.message)];
  const buttons: Button[] =
    state === "deleted"
      ? []
      : [
          state === "new" ? { id: `msg:read:${m.id}`, label: "mark read", style: "secondary" } : { id: `msg:unread:${m.id}`, label: "mark unread", style: "secondary" },
          { id: `msg:delete:${m.id}`, label: "delete", style: "danger" },
          { url: `${site.url}/admin/messages`, label: "inbox" },
        ];
  return { accent: state === "deleted" ? COLORS.grey : state === "read" ? COLORS.lavender : COLORS.pink, blocks, buttons };
}

export function guestbookCard(e: GuestbookEntry, state: GuestbookEntry["status"] | "deleted" = e.status): Card {
  const title =
    state === "pending" ? "✒️ guestbook · needs a look" : state === "approved" ? "✒️ guestbook · on the wall" : state === "rejected" ? "✒️ guestbook · rejected" : "🗑️ guestbook · deleted";
  const who = e.website ? `**${clip(e.name, 40)}** · <${e.website}>` : `**${clip(e.name, 40)}**`;
  const meta = [when(e.createdAt), e.reasons.length ? `flagged: ${e.reasons.join(", ")}` : "passed every filter", `id ${e.id}`].join(" · ");
  const blocks = [`## ${title}`, who, `-# ${meta}`, "---", quote(e.message)];
  const buttons: Button[] = [];
  if (state === "pending") buttons.push({ id: `gb:approve:${e.id}`, label: "approve", style: "success" }, { id: `gb:reject:${e.id}`, label: "reject", style: "danger" });
  if (state === "approved") buttons.push({ id: `gb:reject:${e.id}`, label: "take down", style: "danger" });
  if (state === "rejected") buttons.push({ id: `gb:approve:${e.id}`, label: "approve after all", style: "success" });
  if (state !== "deleted") buttons.push({ id: `gb:delete:${e.id}`, label: "delete", style: "secondary" }, { url: `${site.url}/admin/guestbook`, label: "guestbook admin" });
  const accent = state === "pending" ? COLORS.lavender : state === "approved" ? COLORS.green : state === "rejected" ? COLORS.red : COLORS.grey;
  return { accent, blocks, buttons };
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

/** an activity the widget has no dedicated handler for — includes the raw payload so a handler can be written */
export async function notifyUnknownActivity(activity: unknown, name: string): Promise<boolean> {
  const raw = JSON.stringify(activity, null, 1);
  return send({
    accent: COLORS.lavender,
    blocks: [
      `## 🧩 new activity seen: ${clip(name, 80)}`,
      'the widget shows this as generic "browsing". add a handler in `components/discord/activities/` to make it pretty.',
      "---",
      "```json\n" + clip(raw, 1800) + "\n```",
    ],
  });
}

let dmChannel: string | null = null;

async function send(card: Card, to: "dm" | "channel" = "dm"): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const owner = process.env.DISCORD_OWNER_ID ?? site.discordUserId;

  if (to === "channel") {
    const channel = process.env.DISCORD_GUESTBOOK_CHANNEL_ID;
    if (token && channel) {
      try {
        const res = await fetch(`${API}/channels/${channel}/messages`, { method: "POST", headers: { authorization: `Bot ${token}`, "content-type": "application/json" }, body: JSON.stringify(cardPayload(card)) });
        if (res.ok) return true;
      } catch {}
    }
    const hook = process.env.DISCORD_GUESTBOOK_WEBHOOK_URL;
    if (hook) {
      try {
        const url = hook + (hook.includes("?") ? "&" : "?") + "with_components=true";
        const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cardPayload(card, { interactive: false })) });
        if (res.ok) return true;
      } catch {}
    }
    // channel not reachable: fall through to the dm so nothing gets lost
  }

  if (token) {
    try {
      const headers = { authorization: `Bot ${token}`, "content-type": "application/json" };
      if (!dmChannel) {
        const ch = await fetch(`${API}/users/@me/channels`, { method: "POST", headers, body: JSON.stringify({ recipient_id: owner }) });
        if (ch.ok) dmChannel = (await ch.json()).id;
      }
      if (dmChannel) {
        const res = await fetch(`${API}/channels/${dmChannel}/messages`, { method: "POST", headers, body: JSON.stringify(cardPayload(card)) });
        if (res.ok) return true;
        if (res.status === 404 || res.status === 403) dmChannel = null;
      }
    } catch {}
  }

  // webhooks can show the card but their buttons would be dead, so only link buttons are kept
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (webhook) {
    try {
      const url = webhook + (webhook.includes("?") ? "&" : "?") + "with_components=true";
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cardPayload(card, { interactive: false })) });
      return res.ok;
    } catch {}
  }
  return false;
}
