import { createReadStream, promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Serves files uploaded in /admin (gallery, project thumbnails, setup pictures, buttons).
// `next start` only serves files that were in public/ at build time, so anything uploaded later lands here.
// Supports range requests: safari and iOS will not play a video without them.

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads"));

const TYPES: Record<string, string> = {
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".avif": "image/avif", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
};

const notFound = () => new Response("not found", { status: 404, headers: { "cache-control": "no-store" } });

export async function GET(req: NextRequest, { params }: { params: Promise<{ file: string[] }> }) {
  const { file } = await params;
  const rel = file.map((s) => decodeURIComponent(s)).join("/");
  const full = path.resolve(UPLOAD_DIR, rel);
  // only files inside the upload folder, no dotfiles, no folders
  if (!full.startsWith(UPLOAD_DIR + path.sep) || rel.split("/").some((s) => s.startsWith("."))) return notFound();
  const type = TYPES[path.extname(full).toLowerCase()];
  if (!type) return notFound();
  let size: number;
  try {
    const st = await fs.stat(full);
    if (!st.isFile()) return notFound();
    size = st.size;
  } catch {
    return notFound();
  }

  const headers: Record<string, string> = {
    "content-type": type,
    "accept-ranges": "bytes",
    // file names are random and never reused, so they can be cached for good
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
    ...(type === "image/svg+xml" ? { "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
  };

  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    const body = Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream;
    return new Response(body, { status: 206, headers: { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1) } });
  }
  const body = Readable.toWeb(createReadStream(full)) as ReadableStream;
  return new Response(body, { headers: { ...headers, "content-length": String(size) } });
}
