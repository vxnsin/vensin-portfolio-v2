import { NextResponse, type NextRequest } from "next/server";
import { kvGet, kvSet } from "@/lib/db";

export const dynamic = "force-dynamic";

// the cat's poke counter. one number in kv; a visitor can add at most one poke per second so the number stays honest-ish.
const last = new Map<string, number>();

export async function GET() {
  return NextResponse.json({ pokes: kvGet<number>("pet:pokes", 0) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  if (now - (last.get(ip) ?? 0) < 1000) return NextResponse.json({ pokes: kvGet<number>("pet:pokes", 0) });
  last.set(ip, now);
  if (last.size > 5000) last.clear();
  const pokes = kvGet<number>("pet:pokes", 0) + 1;
  kvSet("pet:pokes", pokes);
  return NextResponse.json({ pokes });
}
