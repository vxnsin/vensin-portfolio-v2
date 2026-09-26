import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "impressum", robots: { index: false } };

// The Impressum is hosted by an external service so the postal address never sits in this repo or on this server.
// Set IMPRESSUM_URL and this page forwards there.
export default function ImpressumPage() {
  const url = process.env.IMPRESSUM_URL;
  if (url) redirect(url);

  return (
    <div className="grid gap-3 text-sm">
      <h2 className="pixel text-lg text-accent">impressum</h2>
      <p className="text-ink-soft text-xs">
        the impressum is provided through an external impressum service and is not configured yet. until then, reach me via the{" "}
        <Link href="/contact">contact form</Link>. the <Link href="/privacy">privacy policy</Link> is already in place.
      </p>
    </div>
  );
}
