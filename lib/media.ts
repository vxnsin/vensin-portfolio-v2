import sharp from "sharp";
import convert from "heic-convert";
import { promises as fs } from "fs";
import { photoTakenAt, stripVideoLocation, videoTakenAt } from "./media-meta";

export type Processed = { buffer: Buffer; ext: string; contentType: string; kind: "image" | "video"; /** capture time from the file itself, null if it has none */ takenAt: string | null };

/** pictures are decoded in memory, so they keep a cap; videos have none (they are streamed to disk, see lib/upload.ts) */
export const MAX_IMAGE_BYTES = 100 * 1024 * 1024;

const VIDEO_EXT = /\.(mp4|m4v|mov|webm)$/i;
const HEIC_EXT = /\.(heic|heif)$/i;
const IMAGE_EXT = /\.(heic|heif|jpe?g|png|webp|gif|avif|tiff?)$/i;

export const ext = (name: string) => name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";

export const isVideoName = (name: string, type = "") => type.startsWith("video/") || VIDEO_EXT.test(name);
export const isImageName = (name: string, type = "") => type.startsWith("image/") || IMAGE_EXT.test(name);

export function isVideo(file: File) {
  return isVideoName(file.name, file.type);
}
export function isHeic(file: File) {
  return /image\/hei[cf]/i.test(file.type) || HEIC_EXT.test(file.name);
}

export const videoType = (e: string) => (e === ".webm" ? "video/webm" : e === ".mov" ? "video/quicktime" : "video/mp4");

/** a picture as a webp (gifs stay gifs), with the capture time read first because re-encoding drops all metadata, gps included */
export async function processImage(input: Buffer, name: string, type = ""): Promise<Processed> {
  let buffer = input;
  const takenAt = await photoTakenAt(buffer);
  if (/image\/hei[cf]/i.test(type) || HEIC_EXT.test(name)) buffer = Buffer.from(await convert({ buffer, format: "JPEG", quality: 0.92 }));
  // gifs stay gifs so they keep moving, but are written anew so comments and xmp blocks are gone too
  if (type === "image/gif" || ext(name) === ".gif") return { buffer: await sharp(buffer, { animated: true }).gif().toBuffer(), ext: ".gif", contentType: "image/gif", kind: "image", takenAt };
  const webp = await sharp(buffer)
    .rotate() // respect exif orientation (phone photos)
    .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();
  return { buffer: webp, ext: ".webp", contentType: "image/webp", kind: "image", takenAt };
}

/** Normalises a small upload held in memory: HEIC → JPEG, images resized + WebP, videos passed through. */
export async function processUpload(file: File): Promise<Processed> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isVideo(file)) {
    const e = ext(file.name) || ".mp4";
    const takenAt = e === ".webm" ? null : videoTakenAt(buffer);
    // phones write where a video was recorded into the file; that never goes online
    if (e !== ".webm") stripVideoLocation(buffer);
    return { buffer, ext: e, contentType: file.type || videoType(e), kind: "video", takenAt };
  }
  return processImage(buffer, file.name, file.type);
}

/**
 * The same for a video already on disk, without loading it: only the "moov" box (the index and metadata, a few kB to
 * a few MB, at the start or the end of the file) is read, the date taken from it, the location blanked and written back.
 */
export async function processVideoFile(file: string): Promise<{ takenAt: string | null }> {
  const fh = await fs.open(file, "r+");
  try {
    const { size } = await fh.stat();
    const head = Buffer.alloc(16);
    let p = 0;
    while (p + 8 <= size) {
      const { bytesRead } = await fh.read(head, 0, 16, p);
      if (bytesRead < 8) break;
      let box = head.readUInt32BE(0);
      const type = head.toString("latin1", 4, 8);
      let header = 8;
      if (box === 1 && bytesRead >= 16) {
        box = Number(head.readBigUInt64BE(8));
        header = 16;
      } else if (box === 0) box = size - p;
      if (box < header || p + box > size) break;
      if (type === "moov") {
        if (box > 256 * 1024 * 1024) break; // not a real index
        const buf = Buffer.alloc(box);
        await fh.read(buf, 0, box, p);
        const takenAt = videoTakenAt(buf);
        if (stripVideoLocation(buf) > 0) await fh.write(buf, 0, box, p);
        return { takenAt };
      }
      p += box;
    }
    return { takenAt: null };
  } finally {
    await fh.close();
  }
}

/** a small picture kept at its exact size (88x31 buttons and the like), written anew so no metadata survives: gifs stay animated gifs, everything else becomes a png */
export async function cleanSmallImage(input: Buffer, name: string, type = ""): Promise<{ buffer: Buffer; ext: string }> {
  if (type === "image/gif" || ext(name) === ".gif") return { buffer: await sharp(input, { animated: true }).gif().toBuffer(), ext: ".gif" };
  return { buffer: await sharp(input).png().toBuffer(), ext: ".png" };
}
