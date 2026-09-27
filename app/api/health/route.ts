import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getHealth, saveHealth } from "@/lib/store";

// Receives today's Apple Watch activity from an iOS Shortcut (see README).
// POST /api/health  Authorization: Bearer <HEALTH_TOKEN>
// { "move": 420, "exercise": 25, "stand": 9, "steps": 6800, "moveGoal": 500, "exerciseGoal": 30, "standGoal": 12 }

// The shortcut hands over whatever Health gives it: "512,3 kcal", "1.234 Schritte", "25 min", plain numbers, sometimes nothing.
// Units are dropped, a decimal comma becomes a point, a thousands separator disappears, an empty value counts as 0.
const num = z.preprocess((v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;
  let t = String(v).trim().replace(/[^\d,.\-]/g, "");
  if (!t) return 0;
  if (t.includes(",") && t.includes(".")) t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, ""); // 1.234,5 → 1234.5 · 1,234.5 → 1234.5
  else if (t.includes(",")) t = t.replace(/,/g, "."); // the phone runs in german: a lone comma is a decimal comma, 512,3 → 512.3, 57,419 → 57.419
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); // 1.234 → 1234
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}, z.number());
const goal = (fallback: number) => z.preprocess((v) => (v === "" || v === null || v === undefined ? fallback : v), num.pipe(z.number().positive()));

const Body = z.object({
  move: num.pipe(z.number().min(0)),
  exercise: num.pipe(z.number().min(0)),
  stand: num.pipe(z.number().min(0)),
  steps: num.pipe(z.number().min(0)).optional(),
  moveGoal: goal(Number(process.env.HEALTH_MOVE_GOAL ?? 500)),
  exerciseGoal: goal(Number(process.env.HEALTH_EXERCISE_GOAL ?? 30)),
  standGoal: goal(Number(process.env.HEALTH_STAND_GOAL ?? 12)),
  date: z.string().max(10).optional(),
});

function authorized(req: Request) {
  const token = process.env.HEALTH_TOKEN;
  if (!token) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${token}`;
}

export async function GET() {
  const h = await getHealth();
  return NextResponse.json(h ?? null, { headers: { "cache-control": "public, max-age=60" } });
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });

  const health = { ...parsed.data, updatedAt: new Date().toISOString() };
  await saveHealth(health);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, health });
}
