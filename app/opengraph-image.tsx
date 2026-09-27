import { ogImage, OG_SIZE } from "@/lib/og";
import { CAT_FACE, catFaceSvg } from "@/lib/cat-face";
import { site } from "@/data/site";

export const alt = site.domain;
export const size = OG_SIZE;
export const contentType = "image/png";

// the home card: wordmark, tagline and mochi, in the same window frame as every other page's card
export default function OpenGraphImage() {
  const s = 22;
  return ogImage({
    kicker: "home",
    title: site.domain,
    subtitle: `${site.tagline} · live discord status, anime shelf, music with lyrics, a guestbook and a cat`,
    sprite: { src: catFaceSvg(CAT_FACE, s), width: CAT_FACE[0].length * s, height: CAT_FACE.length * s },
  });
}
