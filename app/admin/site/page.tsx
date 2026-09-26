import { requireAdmin } from "@/lib/auth";
import { getSettingsFresh } from "@/lib/store";
import { SiteForm } from "./SiteForm";

export const dynamic = "force-dynamic";

export default async function AdminSite() {
  await requireAdmin();
  const settings = await getSettingsFresh();
  return <SiteForm marquee={settings.marquee} now={settings.now} />;
}
