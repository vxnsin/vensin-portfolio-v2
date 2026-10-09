import sharp from "sharp";
import convert from "heic-convert";
import { photoTakenAt, stripVideoLocation, videoTakenAt } from "./media-meta";

export type Processed = { buffer: Buffer; ext: string; contentType: string; kind: "image" | "video"; /** capture time from the file itself, null if it has none */ takenAt: string | null };

export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

const VIDEO_EXT = /\.(mp4|m4v|mov|webm)$/i;
const HEIC_EXT = /\.(heic|heif)$/i;

const ext = (name: string) => name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";

export function isVideo(file: File) {
  return file.type.startsWith("video/") || VIDEO_EXT.test(file.name);
}
export function isHeic(file: File) {
  return /image\/hei[cf]/i.test(file.type) || HEIC_EXT.test(file.name);
}

/** Normalises an upload: HEIC → JPEG, images resized + WebP, videos passed through. */
export async function processUpload(file: File): Promise<Processed> {
  let buffer = Buffer.from(await file.arrayBuffer());

  if (isVideo(file)) {
    const e = ext(file.name) || ".mp4";
    const type = file.type || (e === ".webm" ? "video/webm" : e === ".mov" ? "video/quicktime" : "video/mp4");
    const takenAt = e === ".webm" ? null : videoTakenAt(buffer);
    // phones write where a video was recorded into the file; that never goes online
    if (e !== ".webm") stripVideoLocation(buffer);
    return { buffer, ext: e, contentType: type, kind: "video", takenAt };
  }

  // read the date before anything re-encodes the picture (that drops all metadata, gps included)
  const takenAt = await photoTakenAt(buffer);

  if (isHeic(file)) {
    const out = await convert({ buffer, format: "JPEG", quality: 0.92 });
    buffer = Buffer.from(out);
  }

  // gifs stay gifs so they keep moving
  if (file.type === "image/gif" || ext(file.name) === ".gif") {
    return { buffer, ext: ".gif", contentType: "image/gif", kind: "image", takenAt };
  }

  const webp = await sharp(buffer)
    .rotate() // respect exif orientation (phone photos)
    .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();

  return { buffer: webp, ext: ".webp", contentType: "image/webp", kind: "image", takenAt };
}
