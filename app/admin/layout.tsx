import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { logoutAction } from "./actions";
import { getMaintenance } from "@/lib/maintenance";

export const metadata: Metadata = { title: "admin", robots: { index: false, follow: false } };

const links = [
  { href: "/admin", label: "dashboard" },
  { href: "/admin/messages", label: "messages" },
  { href: "/admin/guestbook", label: "guestbook" },
  { href: "/admin/gallery", label: "gallery" },
  { href: "/admin/anime", label: "anime" },
  { href: "/admin/neighbors", label: "neighbors" },
  { href: "/admin/spotify", label: "spotify" },
  { href: "/admin/updates", label: "update log" },
  { href: "/admin/seasons", label: "seasons" },
  { href: "/admin/site", label: "marquee" },
  { href: "/admin/maintenance", label: "maintenance" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  const maintenance = admin ? getMaintenance().on : false;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs border-b border-dashed border-line pb-3">
        <span className="pixel text-accent mr-2">admin</span>
        {admin &&
          links.map((l) => (
            <Link key={l.href} href={l.href} className="chip no-underline hover:bg-accent-soft">
              {l.label}
            </Link>
          ))}
        {admin && (
          <form action={logoutAction} className="ml-auto">
            <button type="submit" className="btn text-[11px]">
              logout
            </button>
          </form>
        )}
      </div>
      {maintenance && (
        <div className="border border-dashed px-3 py-1.5 text-xs" style={{ borderColor: "var(--dnd)", color: "var(--dnd)" }}>
          maintenance mode is on — visitors see the maintenance page, you see the real site. <Link href="/admin/maintenance">manage</Link>
        </div>
      )}
      {children}
    </div>
  );
}
