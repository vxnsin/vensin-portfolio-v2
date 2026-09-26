import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "vd_admin";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const secret = () => process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD ?? "";
const sign = (exp: string) => createHmac("sha256", secret()).update(exp).digest("hex");

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

export const adminEnabled = () => Boolean(process.env.ADMIN_PASSWORD);

/** Validates a raw session cookie value. Pure, so the proxy can use it too. */
export function verifyAdminToken(raw: string | undefined | null): boolean {
  if (!adminEnabled() || !raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || Number.isNaN(Number(exp)) || Date.now() > Number(exp)) return false;
  return safeEqual(sign(exp), sig);
}

/** Checks a plain password against ADMIN_PASSWORD (used for login and for confirming risky actions). */
export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && safeEqual(password, expected!);
}

export async function isAdmin(): Promise<boolean> {
  return verifyAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function login(password: string): Promise<boolean> {
  if (!checkPassword(password)) return false;
  const exp = String(Date.now() + TTL_MS);
  (await cookies()).set(ADMIN_COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
}
