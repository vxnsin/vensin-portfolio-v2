"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { login, logout, requireAdmin } from "@/lib/auth";
import { addGalleryItem, deleteMessage, removeGalleryItem, saveSettings, updateMessage, getSettingsFresh, uid } from "@/lib/store";

export type ActionState = { ok: boolean; error?: string } | null;

/* ---------- auth ---------- */

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ok = await login(String(formData.get("password") ?? ""));
  if (!ok) return { ok: false, error: "nope." };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/* ---------- messages ---------- */

export async function toggleReadAction(formData: FormData) {
  await requireAdmin();
  await updateMessage(String(formData.get("id")), { read: formData.get("read") === "1" });
  revalidatePath("/admin/messages");
}

export async function deleteMessageAction(formData: FormData) {
  await requireAdmin();
  await deleteMessage(String(formData.get("id")));
  revalidatePath("/admin/messages");
}

/* ---------- gallery ---------- */

const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const file = formData.get("file");
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 120);
  const tag = String(formData.get("tag") ?? "").trim().toLowerCase().slice(0, 30) || "misc";

  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "pick an image first" };
  if (!file.type.startsWith("image/")) return { ok: false, error: "images only" };
  if (file.size > MAX_BYTES) return { ok: false, error: "max 8 MB per image" };

  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_").toLowerCase();
  const key = `gallery/${uid()}-${safeName}`;

  try {
    let url: string;
    let pathname: string | undefined;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(key, file, { access: "public", addRandomSuffix: false });
      url = blob.url;
      pathname = blob.pathname;
    } else {
      // local dev fallback: public/uploads (gitignored)
      const dir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(dir, { recursive: true });
      const name = key.replace("gallery/", "");
      await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
      url = `/uploads/${name}`;
    }
    await addGalleryItem({ url, caption, tag, pathname });
    revalidatePath("/admin/gallery");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "upload failed" };
  }
}

export async function deleteGalleryAction(formData: FormData) {
  await requireAdmin();
  const item = await removeGalleryItem(String(formData.get("id")));
  if (item) {
    try {
      if (item.pathname && process.env.BLOB_READ_WRITE_TOKEN) await del(item.url);
      else if (item.url.startsWith("/uploads/")) await fs.unlink(path.join(process.cwd(), "public", item.url));
    } catch {}
  }
  revalidatePath("/admin/gallery");
}

/* ---------- update log ---------- */

export async function addUpdateAction(formData: FormData) {
  await requireAdmin();
  const date = String(formData.get("date") ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);
  const text = String(formData.get("text") ?? "").trim().slice(0, 300);
  if (!text) return;
  const s = await getSettingsFresh();
  await saveSettings({ updateLog: [{ id: uid(), date, text }, ...s.updateLog].slice(0, 100) });
  revalidatePath("/admin/updates");
}

export async function deleteUpdateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const s = await getSettingsFresh();
  await saveSettings({ updateLog: s.updateLog.filter((u) => u.id !== id) });
  revalidatePath("/admin/updates");
}

/* ---------- marquee + now box ---------- */

export async function saveSiteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const marquee = String(formData.get("marquee") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 40);
  const now = {
    watching: String(formData.get("watching") ?? "").trim().slice(0, 80),
    playing: String(formData.get("playing") ?? "").trim().slice(0, 80),
    listening: String(formData.get("listening") ?? "").trim().slice(0, 80),
    mood: String(formData.get("mood") ?? "").trim().slice(0, 80),
  };
  try {
    await saveSettings({ marquee, now });
    revalidatePath("/admin/site");
    return { ok: true };
  } catch {
    return { ok: false, error: "could not save" };
  }
}
