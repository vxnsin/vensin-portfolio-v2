"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { addMessage, messagesFromSender } from "@/lib/store";
import { ipHash } from "@/lib/guestbook";
import { notifyNewMessage } from "@/lib/discord-notify";

export type ContactState = { ok: boolean; error?: string } | null;

const Schema = z.object({
  name: z.string().trim().min(1, "tell me your name").max(80),
  email: z.string().trim().email("that email looks off").max(120),
  message: z
    .string()
    .trim()
    .min(5, "say a little more")
    .max(2000, "that's a novel, keep it under 2000 chars"),
  website: z.string().max(0).optional(), // honeypot: real people leave it empty
});

// two messages a day per sender; counted in the database against a hashed ip, so it survives restarts
const MAX_PER_DAY = 2;

export async function sendMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = Schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    // honeypot filled → pretend success, drop silently
    if (first?.path[0] === "website") return { ok: true };
    return {
      ok: false,
      error: first?.message ?? "something's wrong with the form",
    };
  }

  const ip = ((await headers()).get("x-forwarded-for") ?? "local")
    .split(",")[0]
    .trim();
  const hash = ipHash(ip);
  if (messagesFromSender(hash, 24 * 3600_000) >= MAX_PER_DAY)
    return {
      ok: false,
      error:
        "two messages a day is plenty, i promise i'll read them. try again tomorrow.",
    };

  try {
    const { name, email, message } = parsed.data;
    const saved = await addMessage({ name, email, message }, hash);
    await notifyNewMessage(saved);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "couldn't save your message, sorry. dm me on discord instead?",
    };
  }
}
