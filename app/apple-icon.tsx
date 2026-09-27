import { ImageResponse } from "next/og";
import { CAT_FACE, catFaceSvg } from "@/lib/cat-face";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// home screen icon on iphones: same face, bigger, rounded by ios itself
export default function AppleIcon() {
  const s = 14;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1f1826" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={catFaceSvg(CAT_FACE, s)} alt="" width={CAT_FACE[0].length * s} height={CAT_FACE.length * s} />
      </div>
    ),
    size,
  );
}
