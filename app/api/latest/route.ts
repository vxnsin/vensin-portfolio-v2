import { NextResponse, type NextRequest } from "next/server";
import { clientIp, limited, tooManyResponse } from "@/lib/ratelimit";
import { refreshLatest } from "@/lib/latest";
import { getLatest } from "@/lib/store";

// Fallback for hosts without the in-process scheduler: visitors' browsers ping this while they
// look at the widget, and the server refreshes the "latest" box at most once a minute.
const MIN_INTERVAL_MS = 60_000;

export async function POST(req: NextRequest) {
  if (limited(`latest:${clientIp(req.headers)}`, 10, 60_000)) return tooManyResponse();
  const current = await getLatest();
  if (current.checkedAt && Date.now() - new Date(current.checkedAt).getTime() < MIN_INTERVAL_MS) {
    return NextResponse.json({ ok: true, skipped: "fresh" });
  }
  try {
    const ok = await refreshLatest();
    return NextResponse.json({ ok }, { status: ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
