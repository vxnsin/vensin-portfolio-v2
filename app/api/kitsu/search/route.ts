import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { kitsuSearchMany } from "@/lib/kitsu";

// admin-only: live suggestions while typing in /admin/anime
export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);
  return NextResponse.json(await kitsuSearchMany(q, 8));
}
