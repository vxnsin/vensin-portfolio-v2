import { NextResponse, type NextRequest } from "next/server";
import { kvGet, kvSet } from "@/lib/db";
import { clientIp, limited, tooManyResponse } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// the cat's poke counter. one number in kv; a visitor can add at most one poke per second (and 40 a minute) so the number stays honest-ish.
export async function GET(req: NextRequest) {
  if (limited(`pet-get:${clientIp(req.headers)}`, 120, 60_000)) return tooManyResponse();
  return NextResponse.json({ pokes: kvGet<number>("pet:pokes", 0) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (limited(`pet-min:${ip}`, 40, 60_000)) return tooManyResponse();
  if (limited(`pet-sec:${ip}`, 1, 1000)) return NextResponse.json({ pokes: kvGet<number>("pet:pokes", 0) });
  const pokes = kvGet<number>("pet:pokes", 0) + 1;
  kvSet("pet:pokes", pokes);
  return NextResponse.json({ pokes });
}
