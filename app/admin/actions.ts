"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { clientIp, limited } from "@/lib/ratelimit";
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
import { deleteProject, moveProject, saveProject, type ProjectLink, type ProjectStatus } from "@/lib/projects";
import { deleteSetupItem, moveSetupItem, saveSetupItem } from "@/lib/setup";
import { saveAbout } from "@/lib/about";
import { MAX_IMAGE_BYTES, processUpload } from "@/lib/media";
import { UPLOAD_DIR } from "@/lib/upload";
import { wallTime } from "@/lib/media-meta";
import { deleteFolder, moveFolder, saveFolder, setFolderCover, setItemCaption, setItemFolder, setItemTakenAt, setItemTitle } from "@/lib/gallery";
import { derivedFiles, kickVideoQueue } from "@/lib/video";

export type ActionState = { ok: boolean; error?: string } | null;

/* ---------- projects ---------- */

const LINK_TYPES = ["github", "website", "discord"] as const;
const PROJECT_STATUSES: ProjectStatus[] = ["active", "archived", "shut down"];

export async function saveProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const str = (k: string, max = 200) => String(formData.get(k) ?? "").trim().slice(0, max);
  const id = str("id") || undefined;
  const name = str("name", 80);
  const tagline = str("tagline", 120);
  const description = str("description", 1200);
  if (!name || !tagline || !description) return { ok: false, error: "name, tagline and description are needed" };
  const start = Number(formData.get("start"));
  const endRaw = str("end", 4);
  const end = endRaw ? Number(endRaw) : undefined;
  if (!Number.isInteger(start) || start < 2000 || start > 2100) return { ok: false, error: "start year looks off" };
  if (end !== undefined && (!Number.isInteger(end) || end < start)) return { ok: false, error: "end year must be after the start year" };
  const statusRaw = str("status", 20);
  const status = PROJECT_STATUSES.includes(statusRaw as ProjectStatus) ? (statusRaw as ProjectStatus) : "active";
  const tech = str("tech", 400).split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20);
  const highlights = str("highlights", 2000).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 10);
  const links: ProjectLink[] = [];
  for (const line of str("links", 2000).split("\n")) {
    const [typeRaw = "", labelRaw = "", urlRaw = ""] = line.split("|").map((x) => x.trim());
    if (!line.trim()) continue;
    const type = typeRaw.toLowerCase() as ProjectLink["type"];
    if (!LINK_TYPES.includes(type)) return { ok: false, error: `link type "${typeRaw}" is not github, website or discord` };
    if (!/^https?:\/\//i.test(urlRaw)) return { ok: false, error: `link url "${urlRaw}" must start with http(s)://` };
    links.push({ type, url: urlRaw, ...(labelRaw ? { label: labelRaw } : {}) });
  }

  let thumbnail = str("thumbnail", 500);
  const file = formData.get("thumbnailFile");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "max 100 MB per image" };
    try {
      const processed = await processUpload(file);
      if (processed.kind !== "image") return { ok: false, error: "thumbnails have to be images" };
      const fileName = `${uid()}${processed.ext}`;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        thumbnail = (await put(`projects/${fileName}`, processed.buffer, { access: "public", addRandomSuffix: false, contentType: processed.contentType })).url;
      } else {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.writeFile(path.join(UPLOAD_DIR, fileName), processed.buffer);
        thumbnail = `/uploads/${fileName}`;
      }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "thumbnail upload failed" };
    }
  }
  if (!thumbnail) {
    const gh = links.find((l) => l.type === "github")?.url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
    thumbnail = gh ? `https://opengraph.githubassets.com/1/${gh[1]}/${gh[2]}` : "/projects/thumbnails/portfolio.png";
  }

  try {
    saveProject({ slug: str("slug", 60) || undefined, name, tagline, description, tech, thumbnail, start, end, status, role: str("role", 60) || "design + code", highlights, links }, id);
    revalidatePath("/projects");
    revalidatePath("/admin/projects");
    if (!id) redirect("/admin/projects");
    return { ok: true };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // next's redirect
    return { ok: false, error: e instanceof Error ? e.message : "could not save" };
  }
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdmin();
  deleteProject(String(formData.get("id")));
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}

export async function moveProjectAction(formData: FormData) {
  await requireAdmin();
  moveProject(String(formData.get("id")), Number(formData.get("dir")) < 0 ? -1 : 1);
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
}

/* ---------- about page ---------- */

export async function saveAboutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const str = (k: string, max = 4000) => String(formData.get(k) ?? "").trim().slice(0, max);
  const lines = (k: string, max = 20) => str(k).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, max);
  const intro = str("intro", 6000).split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 6);
  if (intro.length === 0) return { ok: false, error: "the intro needs at least one paragraph" };
  const quotes = lines("quotes", 60).map((l) => {
    const [text = "", ...rest] = l.split("|");
    return { text: text.trim().slice(0, 200), by: rest.join("|").trim().slice(0, 80) };
  }).filter((q) => q.text);
  try {
    saveAbout({ intro, learning: str("learning", 140), quotes, likes: lines("likes"), dislikes: lines("dislikes"), askMeAbout: lines("askMeAbout") });
    revalidatePath("/about");
    revalidatePath("/admin/about");
    return { ok: true };
  } catch {
    return { ok: false, error: "could not save" };
  }
}

/* ---------- setup ---------- */

export async function saveSetupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const str = (k: string, max = 300) => String(formData.get(k) ?? "").trim().slice(0, max);
  const id = str("id") || undefined;
  const name = str("name", 80);
  const category = str("category", 30).toLowerCase();
  if (!name || !category) return { ok: false, error: "name and category are needed" };
  const url = str("url");
  if (url && !/^https?:\/\//i.test(url)) return { ok: false, error: "the link must start with http(s)://" };
  let image = str("image");
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "max 100 MB per image" };
    try {
      const processed = await processUpload(file);
      if (processed.kind !== "image") return { ok: false, error: "pictures only" };
      const fileName = `${uid()}${processed.ext}`;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        image = (await put(`setup/${fileName}`, processed.buffer, { access: "public", addRandomSuffix: false, contentType: processed.contentType })).url;
      } else {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.writeFile(path.join(UPLOAD_DIR, fileName), processed.buffer);
        image = `/uploads/${fileName}`;
      }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "upload failed" };
    }
  }
  try {
    saveSetupItem({ name, category, note: str("note", 300), url: url || null, image: image || null }, id);
    revalidatePath("/setup");
    revalidatePath("/admin/setup");
    if (!id) redirect("/admin/setup");
    return { ok: true };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "could not save" };
  }
}

export async function deleteSetupAction(formData: FormData) {
  await requireAdmin();
  deleteSetupItem(String(formData.get("id")));
  revalidatePath("/setup");
  revalidatePath("/admin/setup");
}

export async function moveSetupAction(formData: FormData) {
  await requireAdmin();
  moveSetupItem(String(formData.get("id")), Number(formData.get("dir")) < 0 ? -1 : 1);
  revalidatePath("/setup");
  revalidatePath("/admin/setup");
}

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
  const ip = clientIp(await headers());
  if (limited(`login:${ip}`, 5, 10 * 60_000)) return { ok: false, error: "too many tries. come back in ten minutes." };
  const ok = await login(String(formData.get("password") ?? ""));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 1000)); // brute force gets slow, humans barely notice
    return { ok: false, error: "nope." };
  }
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

// uploads themselves go through /api/admin/upload in pieces, so there is no size limit (see lib/upload.ts)

/** removes an item and its files: the upload itself, a video's still and web copy */
async function deleteGalleryItem(id: string) {
  const item = await removeGalleryItem(id);
  if (!item) return;
  try {
    if (item.pathname && process.env.BLOB_READ_WRITE_TOKEN) await del(item.url);
    else if (item.url.startsWith("/uploads/")) await fs.unlink(path.join(UPLOAD_DIR, path.basename(item.url)));
  } catch {}
  for (const f of derivedFiles(item.url)) await fs.rm(f, { force: true }).catch(() => {});
}

export async function deleteGalleryAction(formData: FormData) {
  await requireAdmin();
  await deleteGalleryItem(String(formData.get("id")));
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery", "layout");
}

/** several items at once: the ticked boxes, then "move" to a folder or "delete" */
export async function bulkGalleryAction(formData: FormData) {
  await requireAdmin();
  const ids = formData.getAll("ids").map(String).filter(Boolean).slice(0, 1000);
  const op = String(formData.get("op") ?? "");
  if (op === "move") {
    const folder = String(formData.get("folder") ?? "") || null;
    for (const id of ids) setItemFolder(id, folder);
  } else if (op === "delete") {
    for (const id of ids) await deleteGalleryItem(id);
  }
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery", "layout");
}

/** picks an item as the cover of the folder it sits in (or of the given folder); "auto" clears it */
export async function setFolderCoverAction(formData: FormData) {
  await requireAdmin();
  const folder = String(formData.get("folder") ?? "");
  if (!folder) return;
  const item = String(formData.get("item") ?? "");
  setFolderCover(folder, item && item !== "auto" ? item : null);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery", "layout");
}

/** tries a failed or skipped video conversion again */
export async function retryVideoAction(formData: FormData) {
  await requireAdmin();
  const { getDb } = await import("@/lib/db");
  getDb().prepare("update gallery set web_status = 'pending' where id = ? and kind = 'video'").run(String(formData.get("id")));
  kickVideoQueue();
  revalidatePath("/admin/gallery");
}

/* ---------- gallery folders ---------- */

export async function saveFolderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const res = saveFolder({
    id: String(formData.get("id") ?? "") || undefined,
    parentId: String(formData.get("parent") ?? "") || null,
    name: String(formData.get("name") ?? ""),
    icon: String(formData.get("icon") ?? "folder"),
    exclusive: formData.get("exclusive") === "on",
    unlisted: formData.get("unlisted") === "on",
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery", "layout");
  return { ok: true };
}

export async function deleteFolderAction(formData: FormData) {
  await requireAdmin();
  deleteFolder(String(formData.get("id")));
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery", "layout");
}

export async function moveFolderAction(formData: FormData) {
  await requireAdmin();
  moveFolder(String(formData.get("id")), formData.get("dir") === "up" ? -1 : 1);
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery", "layout");
}

export async function updateGalleryItemAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  if (formData.has("folder")) setItemFolder(id, String(formData.get("folder") ?? "") || null);
  if (formData.has("title")) setItemTitle(id, String(formData.get("title") ?? ""));
  if (formData.has("caption")) setItemCaption(id, String(formData.get("caption") ?? ""));
  if (formData.has("takenAt")) {
    // a datetime-local field: "2026-06-01T21:03", read as this server's local time; empty clears it
    const raw = String(formData.get("takenAt") ?? "");
    const d = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) ? new Date(raw) : null;
    setItemTakenAt(id, d && Number.isFinite(d.getTime()) ? wallTime(d) : null);
  }
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery", "layout");
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
