import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createPublicKey, verify } from "crypto";
import { site } from "@/data/site";
import { cardPayload, guestbookCard, messageCard } from "@/lib/discord-notify";
import { deleteGuestbookEntry, getGuestbookEntry, setGuestbookStatus } from "@/lib/guestbook";
import { deleteMessage, listMessages, updateMessage } from "@/lib/store";

// Discord calls this for every button click on a notification card ("Interactions Endpoint URL" in the developer portal).
// Requests are signed with the application's public key; anything else is dropped.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PING = 1;
const MESSAGE_COMPONENT = 3;
const PONG = { type: 1 };
const EPHEMERAL = 1 << 6;
const reply = (content: string) => NextResponse.json({ type: 4, data: { content, flags: EPHEMERAL } });
const update = (payload: unknown) => NextResponse.json({ type: 7, data: payload });

function verifySignature(body: string, signature: string | null, timestamp: string | null): boolean {
  const pub = process.env.DISCORD_PUBLIC_KEY;
  if (!pub || !signature || !timestamp) return false;
  try {
    // raw ed25519 key → SPKI DER, which node's crypto understands
    const key = createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pub, "hex")]), format: "der", type: "spki" });
    return verify(null, Buffer.from(timestamp + body), key, Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

type Interaction = { type: number; data?: { custom_id?: string }; user?: { id: string }; member?: { user?: { id: string } } };

export async function POST(req: Request) {
  const body = await req.text();
  if (!verifySignature(body, req.headers.get("x-signature-ed25519"), req.headers.get("x-signature-timestamp"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let interaction: Interaction;
  try {
    interaction = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (interaction.type === PING) return NextResponse.json(PONG);
  if (interaction.type !== MESSAGE_COMPONENT) return reply("nothing to do with that.");

  const owner = process.env.DISCORD_OWNER_ID ?? site.discordUserId;
  const clicker = interaction.user?.id ?? interaction.member?.user?.id;
  if (clicker !== owner) return reply("these buttons are for the site owner only.");

  const [scope, action, id] = (interaction.data?.custom_id ?? "").split(":");
  if (!id) return reply("that button is missing its id.");

  if (scope === "gb") {
    const entry = getGuestbookEntry(id);
    if (!entry) return update(cardPayload({ accent: 0x9a9a9a, blocks: ["## ✒️ guestbook", "that entry is already gone."] }));
    if (action === "delete") {
      deleteGuestbookEntry(id);
      revalidatePath("/guestbook");
      return update(cardPayload(guestbookCard(entry, "deleted")));
    }
    const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : null;
    if (!status) return reply("unknown action.");
    const updated = setGuestbookStatus(id, status) ?? entry;
    revalidatePath("/guestbook");
    return update(cardPayload(guestbookCard(updated)));
  }

  if (scope === "msg") {
    const msg = (await listMessages()).find((m) => m.id === id);
    if (!msg) return update(cardPayload({ accent: 0x9a9a9a, blocks: ["## 📬 message", "that message is already gone."] }));
    if (action === "delete") {
      await deleteMessage(id);
      return update(cardPayload(messageCard(msg, "deleted")));
    }
    if (action === "read" || action === "unread") {
      const read = action === "read";
      await updateMessage(id, { read });
      return update(cardPayload(messageCard({ ...msg, read }, read ? "read" : "new")));
    }
    return reply("unknown action.");
  }

  return reply("unknown button.");
}
