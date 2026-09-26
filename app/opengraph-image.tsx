import { ImageResponse } from "next/og";
import { site } from "@/data/site";

export const alt = site.domain;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#17121c",
          color: "#f1e7f0",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "3px dashed #5c4a62",
            padding: "48px 80px",
            background: "#1f1826",
            boxShadow: "12px 12px 0 #5c4a62",
          }}
        >
          <div style={{ fontSize: 96, letterSpacing: 4 }}>{site.domain}</div>
          <div style={{ fontSize: 30, color: "#b0a4ff", marginTop: 8 }}>{site.jpName}</div>
          <div style={{ fontSize: 28, color: "#b39fb0", marginTop: 28 }}>{site.tagline}</div>
        </div>
        <div style={{ fontSize: 26, color: "#ff8fb4", marginTop: 36 }}>{"(^-^)/  ~ welcome ~"}</div>
      </div>
    ),
    size,
  );
}
