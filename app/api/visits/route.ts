import { NextResponse, type NextRequest } from "next/server";
import { clientIp, limited, tooManyResponse } from "@/lib/ratelimit";
import { visitorStats } from "@/lib/visits";

export const dynamic = "force-dynamic";

// public: the numbers behind the footer counter, polled by open pages so the odometer keeps moving
export async function GET(req: NextRequest) {
  if (limited(`visits:${clientIp(req.headers)}`, 60, 60_000)) return tooManyResponse();
  return NextResponse.json(visitorStats(), { headers: { "cache-control": "no-store" } });
}
