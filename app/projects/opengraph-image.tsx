import { ogImage, OG_SIZE } from "@/lib/og";
import { listProjects } from "@/lib/projects";

export const alt = "projects on vensin.dev";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default function Image() {
  const projects = listProjects();
  const active = projects.filter((p) => p.status === "active");
  const techs = new Set(projects.flatMap((p) => p.tech)).size;
  const thumbs = [...active, ...projects].map((p) => p.thumbnail).filter((t) => t.startsWith("http")).slice(0, 3);
  return ogImage({
    kicker: "projects",
    title: `${projects.length} projects`,
    subtitle: `${active.length} active · ${techs} technologies · ${active.map((p) => p.name).slice(0, 3).join(", ")}`,
    images: thumbs,
    imageShape: "landscape",
    accent: "#8fe36b",
  });
}
