import { NextResponse } from "next/server";
import { z } from "zod";
import { getHealth, saveHealth } from "@/lib/store";

// Receives today's Apple Watch activity from an iOS Shortcut (see README).
// POST /api/health  Authorization: Bearer <HEALTH_TOKEN>
// { "move": 420, "exercise": 25, "stand": 9, "steps": 6800, "moveGoal": 500, "exerciseGoal": 30, "standGoal": 12 }

const Body = z.object({
  move: z.coerce.number().min(0),
  exercise: z.coerce.number().min(0),
  stand: z.coerce.number().min(0),
  steps: z.coerce.number().min(0).optional(),
  moveGoal: z.coerce.number().positive().default(Number(process.env.HEALTH_MOVE_GOAL ?? 500)),
  exerciseGoal: z.coerce.number().positive().default(Number(process.env.HEALTH_EXERCISE_GOAL ?? 30)),
  standGoal: z.coerce.number().positive().default(Number(process.env.HEALTH_STAND_GOAL ?? 12)),
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
  return NextResponse.json({ ok: true, health });
}
