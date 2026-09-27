import { ogImage, OG_SIZE } from "@/lib/og";
import { countGuestbook, listGuestbook } from "@/lib/guestbook";

export const alt = "guestbook on vensin.dev";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default function Image() {
  const total = countGuestbook("approved");
  const latest = listGuestbook({ status: "approved", limit: 1 })[0];
  return ogImage({
    kicker: "guestbook",
    title: total === 1 ? "one signature" : `${total} signatures`,
    subtitle: latest ? `latest: "${latest.message.slice(0, 80)}${latest.message.length > 80 ? "…" : ""}" — ${latest.name}` : "the wall by the door. be the first to sign.",
    accent: "#ffd54a",
  });
}
