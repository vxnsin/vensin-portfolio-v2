import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f1826",
          border: "4px solid #5c4a62",
          color: "#ff8fb4",
          fontSize: 44,
          fontFamily: "monospace",
          fontWeight: 700,
        }}
      >
        v
      </div>
    ),
    size,
  );
}
