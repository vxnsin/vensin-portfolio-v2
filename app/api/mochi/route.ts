import { NextResponse, type NextRequest } from "next/server";
import { kvGet, kvSet } from "@/lib/db";
import { clientIp, limited, tooManyResponse } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// One number for the clicker: how many times mochi has been clicked by everyone, ever. The page sends its clicks in
// small batches; a batch may add at most 200 (nobody clicks faster than that in fifteen seconds), six batches a minute.
const MAX_BATCH = 200;

export async function GET(req: NextRequest) {
  if (limited(`mochi-get:${clientIp(req.headers)}`, 60, 60_000)) return tooManyResponse();
  return NextResponse.json({ clicks: kvGet<number>("mochi:clicks", 0) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (limited(`mochi-post:${ip}`, 6, 60_000)) return tooManyResponse();
  let n = 0;
  try {
    const body = (await req.json()) as { clicks?: unknown };
    n = typeof body.clicks === "number" && isFinite(body.clicks) ? Math.floor(body.clicks) : 0;
  } catch {}
  n = Math.max(0, Math.min(MAX_BATCH, n));
  const clicks = kvGet<number>("mochi:clicks", 0) + n;
  if (n > 0) kvSet("mochi:clicks", clicks);
  return NextResponse.json({ clicks }, { headers: { "cache-control": "no-store" } });
}
