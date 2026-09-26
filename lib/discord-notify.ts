import { site } from "@/data/site";
import type { Message } from "./store";

const API = "https://discord.com/api/v10";

export const discordNotifyConfigured = () => Boolean(process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_WEBHOOK_URL);

function embed(m: Message) {
  return {
    title: "📬 new message on vensin.dev",
    color: 0xe2789b,
    fields: [
      { name: "from", value: `${m.name} · ${m.email}`, inline: false },
      { name: "message", value: m.message.length > 1000 ? m.message.slice(0, 1000) + "…" : m.message, inline: false },
    ],
    footer: { text: `id ${m.id} · open the admin panel to reply` },
    timestamp: m.createdAt,
  };
}

/** DM the site owner through a bot; falls back to a webhook. Never throws. Returns true when something was sent. */
export async function notifyNewMessage(m: Message): Promise<boolean> {
  return send({ embeds: [embed(m)] });
}

/** an activity the widget has no dedicated handler for — includes the raw payload so a handler can be written */
export async function notifyUnknownActivity(activity: unknown, name: string): Promise<boolean> {
  const raw = JSON.stringify(activity, null, 1);
  return send({
    embeds: [
      {
        title: `🧩 new activity seen: ${name}`,
        description: 'the widget shows this as generic "browsing". add a handler in `components/discord/activities/` to make it pretty.',
        color: 0x8b7fd6,
        fields: [{ name: "payload", value: "```json\n" + (raw.length > 950 ? raw.slice(0, 950) + "\n…" : raw) + "\n```" }],
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

async function send(payload: { embeds: unknown[] }): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const owner = process.env.DISCORD_OWNER_ID ?? site.discordUserId;

  if (token) {
    try {
      const headers = { authorization: `Bot ${token}`, "content-type": "application/json" };
      const ch = await fetch(`${API}/users/@me/channels`, { method: "POST", headers, body: JSON.stringify({ recipient_id: owner }) });
      if (ch.ok) {
        const { id } = await ch.json();
        const res = await fetch(`${API}/channels/${id}/messages`, { method: "POST", headers, body: JSON.stringify(payload) });
        if (res.ok) return true;
      }
    } catch {}
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      return res.ok;
    } catch {}
  }
  return false;
}
