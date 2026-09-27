import { requireAdmin } from "@/lib/auth";
import { getAbout } from "@/lib/about";
import { AboutForm } from "./AboutForm";

export const dynamic = "force-dynamic";

export default async function AdminAbout() {
  await requireAdmin();
  return (
    <div className="grid gap-3">
      <h2 className="pixel text-accent">about page</h2>
      <p className="text-xs text-ink-soft">the words on /about. the numbers, the tech stack and the &quot;right now&quot; box fill themselves.</p>
      <AboutForm about={getAbout()} />
    </div>
  );
}
