import type { Metadata } from "next";
import { listGallery } from "@/lib/store";
import { Gallery } from "@/components/gallery/Gallery";

export const metadata: Metadata = { title: "gallery" };

export default async function GalleryPage() {
  const items = await listGallery();
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">gallery.</h2>
        <p className="text-xs text-ink-soft">photos i took. mostly the bike, sometimes other stuff. click to enlarge, arrow keys to flip through.</p>
      </div>
      <Gallery items={items} />
    </div>
  );
}
