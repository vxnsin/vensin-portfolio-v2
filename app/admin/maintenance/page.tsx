import { requireAdmin } from "@/lib/auth";
import { getMaintenance } from "@/lib/maintenance";
import { MaintenanceForm } from "./MaintenanceForm";

export const dynamic = "force-dynamic";

export default async function AdminMaintenance() {
  await requireAdmin();
  const m = getMaintenance();
  return <MaintenanceForm on={m.on} message={m.message} since={m.since} />;
}
