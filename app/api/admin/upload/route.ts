import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createReadStream, promises as fs } from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { isAdmin } from "@/lib/auth";
import { addGalleryItem, uid } from "@/lib/store";
import { listFolders } from "@/lib/gallery";
import { wallTime } from "@/lib/media-meta";
import { ext, isImageName, isVideoName, MAX_IMAGE_BYTES, processImage, processVideoFile, videoType } from "@/lib/media";
import { appendChunk, discard, finishTo, partPath, readPart, received, UPLOAD_DIR, validId } from "@/lib/upload";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Gallery uploads of any size, in pieces (see lib/upload.ts). Admin only.
//   GET    ?id=…            how many bytes of this upload arrived so far
//   PUT    ?id=…&offset=N   the next piece as the raw body
//   POST   ?id=…            done: json { name, type, size, folder, caption, lastModified } → processed and added
//   DELETE ?id=…            give up and remove the piece file

const denied = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return denied();
  const id = req.nextUrl.searchParams.get("id");
  if (!validId(id)) return bad("bad id");
  return NextResponse.json({ received: await received(id) });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return denied();
  const id = req.nextUrl.searchParams.get("id");
  const offset = Number(req.nextUrl.searchParams.get("offset"));
  if (!validId(id) || !Number.isSafeInteger(offset) || offset < 0) return bad("bad id or offset");
  if (!req.body) return bad("empty piece");
  const res = await appendChunk(id, offset, req.body);
  if (!res.ok) return NextResponse.json({ error: res.error, received: res.size }, { status: res.error === "offset mismatch" ? 409 : 500 });
  return NextResponse.json({ received: res.size });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return denied();
  const id = req.nextUrl.searchParams.get("id");
  if (!validId(id)) return bad("bad id");
  await discard(id);
  return NextResponse.json({ ok: true });
}

type Meta = { name?: unknown; type?: unknown; size?: unknown; folder?: unknown; caption?: unknown; lastModified?: unknown };

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return denied();
  const id = req.nextUrl.searchParams.get("id");
  if (!validId(id)) return bad("bad id");
  let meta: Meta;
  try {
    meta = (await req.json()) as Meta;
  } catch {
    return bad("bad json");
  }
  const name = typeof meta.name === "string" ? meta.name.slice(0, 200) : "";
  const type = typeof meta.type === "string" ? meta.type.slice(0, 100) : "";
  const size = Number(meta.size);
  const caption = typeof meta.caption === "string" ? meta.caption.trim().slice(0, 120) : "";
  const folder = listFolders().find((f) => f.id === meta.folder) ?? null;
  const lastModified = Number(meta.lastModified);

  const have = await received(id);
  if (!have || have !== size) return bad(`only ${have} of ${size} bytes arrived`, 409);
  const video = isVideoName(name, type);
  if (!video && !isImageName(name, type)) {
    await discard(id);
    return bad("photos (jpg, png, webp, gif, heic) or videos (mp4, mov, webm) only");
  }
  if (!video && size > MAX_IMAGE_BYTES) {
    await discard(id);
    return bad("pictures can be at most 100 MB");
  }

  try {
    let fileExt: string;
    let contentType: string;
    let takenAt: string | null;
    const fileName = () => `${uid()}${fileExt}`;
    let url: string;
    let pathname: string | undefined;

    if (video) {
      fileExt = ext(name) || ".mp4";
      contentType = type || videoType(fileExt);
      // date and location live in the small index box; webm has neither in a form phones write
      takenAt = fileExt === ".webm" ? null : (await processVideoFile(partPath(id))).takenAt;
      const final = fileName();
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(`gallery/${final}`, createReadStream(partPath(id)), { access: "public", addRandomSuffix: false, contentType, multipart: true });
        await discard(id);
        url = blob.url;
        pathname = blob.pathname;
      } else {
        await finishTo(id, path.join(UPLOAD_DIR, final));
        url = `/uploads/${final}`;
      }
    } else {
      const processed = await processImage(await readPart(id), name, type);
      await discard(id);
      fileExt = processed.ext;
      contentType = processed.contentType;
      takenAt = processed.takenAt;
      const final = fileName();
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(`gallery/${final}`, processed.buffer, { access: "public", addRandomSuffix: false, contentType });
        url = blob.url;
        pathname = blob.pathname;
      } else {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.writeFile(path.join(UPLOAD_DIR, final), processed.buffer);
        url = `/uploads/${final}`;
      }
    }

    // the file's own date on the uploading device, only when the photo or video carries no capture time
    const fallback = Number.isFinite(lastModified) && lastModified > Date.UTC(1995, 0, 1) && lastModified < Date.now() + 86_400_000 ? wallTime(new Date(lastModified)) : null;
    const item = await addGalleryItem({ url, kind: video ? "video" : "image", caption, tag: folder?.slug ?? "", folderId: folder?.id ?? null, takenAt: takenAt ?? fallback, pathname });
    revalidatePath("/admin/gallery");
    revalidatePath("/gallery", "layout");
    return NextResponse.json({ ok: true, id: item.id, takenAt: item.takenAt });
  } catch (e) {
    await discard(id);
    return bad(e instanceof Error ? e.message : "processing failed", 500);
  }
}
