import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "vd_admin";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const secret = () => process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD ?? "";
const sign = (exp: string) => createHmac("sha256", secret()).update(exp).digest("hex");

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

export const adminEnabled = () => Boolean(process.env.ADMIN_PASSWORD);

export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || Number.isNaN(Number(exp)) || Date.now() > Number(exp)) return false;
  return safeEqual(sign(exp), sig);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function login(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !safeEqual(password, expected)) return false;
  const exp = String(Date.now() + TTL_MS);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
