"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { addMessage } from "@/lib/store";
import { notifyNewMessage } from "@/lib/discord-notify";

export type ContactState = { ok: boolean; error?: string } | null;

const Schema = z.object({
  name: z.string().trim().min(1, "tell me your name").max(80),
  email: z.string().trim().email("that email looks off").max(120),
  message: z.string().trim().min(5, "say a little more").max(2000, "that's a novel, keep it under 2000 chars"),
  website: z.string().max(0).optional(), // honeypot: real people leave it empty
});

// very small per-instance rate limit: 3 messages per 10 minutes per ip
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (arr.length >= 3) return true;
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
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
    return { ok: false, error: first?.message ?? "something's wrong with the form" };
  }

  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) return { ok: false, error: "slow down a bit, try again in a few minutes" };

  try {
    const { name, email, message } = parsed.data;
    const saved = await addMessage({ name, email, message });
    await notifyNewMessage(saved);
    return { ok: true };
  } catch {
    return { ok: false, error: "couldn't save your message, sorry. dm me on discord instead?" };
  }
}
