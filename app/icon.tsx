import { ImageResponse } from "next/og";
import { CAT_FACE, catFaceSvg } from "@/lib/cat-face";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// the tab icon: mochi's face on the site's paper, with the usual border
export default function Icon() {
  const w = CAT_FACE[0].length * 5;
  const h = CAT_FACE.length * 5;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1f1826", border: "3px solid #5c4a62" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={catFaceSvg(CAT_FACE, 5)} alt="" width={w} height={h} />
      </div>
    ),
    size,
  );
}
