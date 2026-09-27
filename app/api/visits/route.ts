import { NextResponse } from "next/server";
import { visitorStats } from "@/lib/visits";

export const dynamic = "force-dynamic";

// public: the numbers behind the footer counter, polled by open pages so the odometer keeps moving
export async function GET() {
  return NextResponse.json(visitorStats(), { headers: { "cache-control": "no-store" } });
}
