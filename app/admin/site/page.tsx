import { requireAdmin } from "@/lib/auth";
import { getSettingsFresh } from "@/lib/store";
import { SiteForm } from "./SiteForm";
import { getSeasonSetting, seasonFor } from "@/lib/season";

export const dynamic = "force-dynamic";

export default async function AdminSite() {
  await requireAdmin();
  const settings = await getSettingsFresh();
  return <SiteForm marquee={settings.marquee} season={getSeasonSetting()} calendar={seasonFor()} />;
}
