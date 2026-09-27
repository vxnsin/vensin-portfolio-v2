import { ImageResponse } from "next/og";
import { site } from "@/data/site";

// One card style for every page's social preview: dark paper, dashed window frame, the wordmark in the title bar,
// a big headline, a line of small print and up to four images on the right.

export const OG_SIZE = { width: 1200, height: 630 };

export type OgCard = { title: string; subtitle?: string; kicker?: string; images?: string[]; accent?: string; /** an svg data uri drawn instead of images, pixel-crisp */ sprite?: { src: string; width: number; height: number } };

export function ogImage(card: OgCard) {
  const accent = card.accent ?? "#ff8fb4";
  const images = (card.images ?? []).filter(Boolean).slice(0, 4);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#17121c", color: "#f1e7f0", fontFamily: "monospace", padding: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, border: "3px dashed #5c4a62", background: "#1f1826", boxShadow: "10px 10px 0 #5c4a62" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: "3px solid #5c4a62", background: "#291f32", fontSize: 26 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: 8, background: accent }} />
              <div style={{ width: 16, height: 16, borderRadius: 8, border: "2px solid #5c4a62" }} />
              <div style={{ width: 16, height: 16, borderRadius: 8, border: "2px solid #5c4a62" }} />
            </div>
            <div style={{ display: "flex" }}>{site.domain}</div>
            {card.kicker && <div style={{ display: "flex", marginLeft: "auto", color: "#b39fb0", fontSize: 22 }}>{card.kicker}</div>}
          </div>
          <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "32px 44px", gap: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", fontSize: 64, lineHeight: 1.1, color: accent, fontWeight: 700 }}>{card.title}</div>
              {card.subtitle && <div style={{ display: "flex", marginTop: 20, fontSize: 30, color: "#b39fb0", lineHeight: 1.35 }}>{card.subtitle}</div>}
            </div>
            {card.sprite && (
              <div style={{ display: "flex", flexShrink: 0, padding: 18, border: "3px dashed #5c4a62", background: "#291f32" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.sprite.src} alt="" width={card.sprite.width} height={card.sprite.height} />
              </div>
            )}
            {!card.sprite && images.length > 0 && (
              <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" width={images.length === 1 ? 260 : 150} height={images.length === 1 ? 260 : 225} style={{ objectFit: "cover", border: "3px solid #5c4a62", transform: `rotate(${(i % 2 ? 1 : -1) * (images.length > 1 ? 2 : 0)}deg)` }} />
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 22px", borderTop: "3px dashed #5c4a62", fontSize: 20, color: "#b39fb0" }}>
            <div style={{ display: "flex" }}>{site.tagline}</div>
            <div style={{ display: "flex" }}>_(:з)∠)_</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
