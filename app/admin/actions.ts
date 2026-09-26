"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import { checkPassword, login, logout, requireAdmin } from "@/lib/auth";
import { setMaintenance } from "@/lib/maintenance";
import { disconnectSpotify } from "@/lib/spotify";
import { importExport } from "@/lib/spotify-export";
import {
  addFavorite,
  addGalleryItem,
  addNeighbor,
  addUpdate,
  deleteMessage,
  deleteUpdate,
  moveFavorite,
  moveNeighbor,
  removeFavorite,
  removeNeighbor,
  removeGalleryItem,
  saveMarquee,
  uid,
  updateFavorite,
  updateMessage,
} from "@/lib/store";
import { jobs, runJob } from "@/lib/scheduler";
import { deleteGuestbookEntry, setGuestbookStatus } from "@/lib/guestbook";
import { isSeason, setSeasonSetting } from "@/lib/season";
import { isVideo, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, processUpload } from "@/lib/media";

export type ActionState = { ok: boolean; error?: string } | null;

/* ---------- seasons ---------- */

export async function pinSeasonAction(formData: FormData) {
  await requireAdmin();
  const season = String(formData.get("season") ?? "auto");
  setSeasonSetting(isSeason(season) ? season : "auto");
  revalidatePath("/", "layout");
  revalidatePath("/admin/seasons");
  revalidatePath("/admin/site");
}

/* ---------- guestbook ---------- */

export async function setGuestbookStatusAction(formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status"));
  if (status !== "approved" && status !== "rejected" && status !== "pending") return;
  setGuestbookStatus(String(formData.get("id")), status);
  revalidatePath("/guestbook");
  revalidatePath("/admin/guestbook");
}

export async function deleteGuestbookAction(formData: FormData) {
  await requireAdmin();
  deleteGuestbookEntry(String(formData.get("id")));
  revalidatePath("/guestbook");
  revalidatePath("/admin/guestbook");
}

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

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");

export async function uploadAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const file = formData.get("file");
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 120);
  const tag = String(formData.get("tag") ?? "").trim().toLowerCase().slice(0, 30) || "misc";

  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "pick a file first" };
  const video = isVideo(file);
  if (!video && !file.type.startsWith("image/") && !/\.(heic|heif|jpe?g|png|webp|gif)$/i.test(file.name)) {
    return { ok: false, error: "images (jpg, png, webp, gif, heic) or videos (mp4, mov, webm) only" };
  }
  if (file.size > (video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
    return { ok: false, error: video ? "max 200 MB per video" : "max 30 MB per image" };
  }

  try {
    const processed = await processUpload(file);
    const name = `${uid()}${processed.ext}`;
    let url: string;
    let pathname: string | undefined;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`gallery/${name}`, processed.buffer, { access: "public", addRandomSuffix: false, contentType: processed.contentType });
      url = blob.url;
      pathname = blob.pathname;
    } else {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(path.join(UPLOAD_DIR, name), processed.buffer);
      url = `/uploads/${name}`;
    }

    await addGalleryItem({ url, kind: processed.kind, caption, tag, pathname });
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
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
      else if (item.url.startsWith("/uploads/")) await fs.unlink(path.join(UPLOAD_DIR, item.url.replace("/uploads/", "")));
    } catch {}
  }
  revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
}

/* ---------- update log ---------- */

export async function addUpdateAction(formData: FormData) {
  await requireAdmin();
  const date = String(formData.get("date") ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);
  const text = String(formData.get("text") ?? "").trim().slice(0, 300);
  if (!text) return;
  await addUpdate(date, text);
  revalidatePath("/admin/updates");
  revalidatePath("/");
}

export async function deleteUpdateAction(formData: FormData) {
  await requireAdmin();
  await deleteUpdate(String(formData.get("id")));
  revalidatePath("/admin/updates");
  revalidatePath("/");
}

/* ---------- scheduler ---------- */

export async function runJobAction(formData: FormData) {
  await requireAdmin();
  const job = jobs.find((j) => j.id === String(formData.get("id")));
  if (job) await runJob(job);
  revalidatePath("/admin");
  revalidatePath("/admin/spotify");
  revalidatePath("/music");
  revalidatePath("/", "layout");
}

/* ---------- favorite anime ---------- */

const clampRating = (v: unknown) => Math.min(10, Math.max(1, Math.round(Number(v) || 0)));

export async function addFavoriteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const kitsuId = String(formData.get("kitsuId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  if (!kitsuId || !title) return { ok: false, error: "pick an anime from the suggestions first" };
  const fav = await addFavorite({
    kitsuId,
    title,
    slug: String(formData.get("slug") ?? "").trim(),
    poster: String(formData.get("poster") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim().slice(0, 80),
    rating: clampRating(formData.get("rating")),
  });
  if (!fav) return { ok: false, error: "already on the list" };
  revalidatePath("/admin/anime");
  revalidatePath("/anime");
  return { ok: true };
}

export async function updateFavoriteAction(formData: FormData) {
  await requireAdmin();
  await updateFavorite(String(formData.get("id")), {
    note: String(formData.get("note") ?? "").trim().slice(0, 80),
    rating: clampRating(formData.get("rating")),
  });
  revalidatePath("/admin/anime");
  revalidatePath("/anime");
}

export async function deleteFavoriteAction(formData: FormData) {
  await requireAdmin();
  await removeFavorite(String(formData.get("id")));
  revalidatePath("/admin/anime");
  revalidatePath("/anime");
}

export async function moveFavoriteAction(formData: FormData) {
  await requireAdmin();
  await moveFavorite(String(formData.get("id")), formData.get("dir") === "up" ? -1 : 1);
  revalidatePath("/admin/anime");
  revalidatePath("/anime");
}

/* ---------- maintenance mode ---------- */

export async function setMaintenanceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!checkPassword(String(formData.get("password") ?? ""))) return { ok: false, error: "wrong password, nothing changed." };
  const on = formData.get("on") === "1";
  const message = String(formData.get("message") ?? "").trim().slice(0, 200);
  setMaintenance(on, message);
  revalidatePath("/admin/maintenance");
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------- neighbors ---------- */

export async function addNeighborAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const url = String(formData.get("url") ?? "").trim();
  let buttonUrl = String(formData.get("buttonUrl") ?? "").trim();
  const file = formData.get("file");
  if (!name || !url.startsWith("http")) return { ok: false, error: "name and a valid site url are required" };
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/") || file.size > 512 * 1024) return { ok: false, error: "button must be an image under 512 kb" };
    const dot = file.name.lastIndexOf(".");
    const ext = (dot >= 0 ? file.name.slice(dot) : ".png").toLowerCase();
    const fileName = `btn-${uid()}${ext}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(await file.arrayBuffer()));
    buttonUrl = `/uploads/${fileName}`;
  }
  if (!buttonUrl) return { ok: false, error: "add a button image url or upload one" };
  await addNeighbor({ name, url, buttonUrl });
  revalidatePath("/admin/neighbors");
  revalidatePath("/links");
  return { ok: true };
}

export async function deleteNeighborAction(formData: FormData) {
  await requireAdmin();
  await removeNeighbor(String(formData.get("id")));
  revalidatePath("/admin/neighbors");
  revalidatePath("/links");
}

export async function moveNeighborAction(formData: FormData) {
  await requireAdmin();
  await moveNeighbor(String(formData.get("id")), formData.get("dir") === "up" ? -1 : 1);
  revalidatePath("/admin/neighbors");
  revalidatePath("/links");
}

/* ---------- spotify ---------- */

export async function disconnectSpotifyAction() {
  await requireAdmin();
  disconnectSpotify();
  revalidatePath("/admin/spotify");
  revalidatePath("/music");
}

export async function importSpotifyExportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { ok: false, error: "pick at least one json file" };
  if (files.some((f) => f.size > 60 * 1024 * 1024)) return { ok: false, error: "files over 60 mb are too big, split the export" };
  try {
    const texts = await Promise.all(files.map((f) => f.text()));
    const r = importExport(texts);
    revalidatePath("/admin/spotify");
    revalidatePath("/music");
    const span = r.from && r.to ? ` (${r.from.slice(0, 10)} → ${r.to.slice(0, 10)})` : "";
    return { ok: true, error: `${r.imported} plays from ${r.entries} entries in ${r.files} file(s)${span}, ${r.skippedOverlap} skipped as already logged live` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "import failed" };
  }
}

/* ---------- marquee ---------- */

export async function saveSiteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const marquee = String(formData.get("marquee") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 40);
  try {
    await saveMarquee(marquee);
    revalidatePath("/admin/site");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "could not save" };
  }
}
