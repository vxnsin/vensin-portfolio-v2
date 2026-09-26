"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addGuestbookEntry, ipHash, isDuplicate, recentFromVisitor, screenEntry } from "@/lib/guestbook";
import { notifyGuestbook } from "@/lib/discord-notify";

export type GuestbookState = { ok: boolean; pending?: boolean; error?: string } | null;

const Schema = z.object({
  name: z.string().trim().min(1, "tell me your name").max(40, "keep the name under 40 chars"),
  message: z.string().trim().min(2, "say a little more").max(1000, "keep it under 1000 chars"),
  website: z
    .string()
    .trim()
    .max(120, "that url is too long")
    .transform((s) => (s && !/^https?:\/\//i.test(s) ? `https://${s}` : s))
    .refine((s) => !s || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(s), "that website looks off")
    .optional(),
  company: z.string().max(0).optional(), // honeypot: real people leave it empty
});

export async function signGuestbook(_prev: GuestbookState, formData: FormData): Promise<GuestbookState> {
  const parsed = Schema.safeParse({
    name: formData.get("name"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
    company: formData.get("company") ?? "",
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    if (first?.path[0] === "company") return { ok: true }; // bot filled the honeypot: pretend it worked
    return { ok: false, error: first?.message ?? "something's wrong with the form" };
  }

  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const hash = ipHash(ip);
  if (recentFromVisitor(hash, 5 * 60_000) >= 1) return { ok: false, error: "you just signed. give it a few minutes." };
  if (recentFromVisitor(hash, 24 * 3600_000) >= 5) return { ok: false, error: "that's plenty for one day." };

  const { name, message } = parsed.data;
  const website = parsed.data.website || null;
  if (isDuplicate(message)) return { ok: true }; // already on the wall (or bot replay), nothing to add

  const screening = screenEntry({ name, message, website });
  if (screening.verdict === "reject") return { ok: true }; // dropped quietly, no need to tell a spammer why

  try {
    const entry = addGuestbookEntry({ name, message, website, status: screening.verdict === "approve" ? "approved" : "pending", reasons: screening.reasons, ipHash: hash });
    if (entry.status === "approved") revalidatePath("/guestbook");
    await notifyGuestbook(entry);
    return { ok: true, pending: entry.status === "pending" };
  } catch {
    return { ok: false, error: "couldn't save that, sorry. try again in a bit?" };
  }
}
