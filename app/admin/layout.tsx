import Link from "next/link";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import { logoutAction } from "./actions";

export const metadata: Metadata = { title: "admin", robots: { index: false, follow: false } };

const links = [
  { href: "/admin", label: "dashboard" },
  { href: "/admin/messages", label: "messages" },
  { href: "/admin/gallery", label: "gallery" },
  { href: "/admin/updates", label: "update log" },
  { href: "/admin/site", label: "marquee & now" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
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
      {children}
    </div>
  );
}
