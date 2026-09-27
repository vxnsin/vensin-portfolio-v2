import { ogImage, OG_SIZE } from "@/lib/og";
import { CAT_FACE, catFaceSvg } from "@/lib/cat-face";
import { kvGet } from "@/lib/db";
import { fmt } from "@/lib/mochi-game";

export const alt = "mochi clicker on vensin.dev";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default function Image() {
  const s = 22;
  const clicks = kvGet<number>("mochi:clicks", 0);
  return ogImage({
    kicker: "mochi clicker",
    title: "click the cat",
    subtitle: `buy her things, catch golden mochi, use her nine lives · clicked ${fmt(clicks)} times by everyone so far`,
    sprite: { src: catFaceSvg(CAT_FACE, s), width: CAT_FACE[0].length * s, height: CAT_FACE.length * s },
    accent: "#ffd54a",
  });
}
