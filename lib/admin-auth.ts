import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "standcon_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function adminAccount(): string {
  return process.env.ADMIN_ACCOUNT || "admin";
}

export function isAdminConfigured(): boolean {
  return adminPassword().length > 0;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", adminPassword()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function verifyAdminCredentials(account: string, password: string): boolean {
  const expectedAccount = adminAccount();
  const expectedPassword = adminPassword();
  if (!expectedPassword) return false;

  return safeEqual(account, expectedAccount) && safeEqual(password, expectedPassword);
}

export async function createAdminSession(account: string): Promise<void> {
  const issuedAt = Date.now();
  const payload = `${account}.${issuedAt}`;
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const password = adminPassword();
  if (!password) return false;

  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const [account, issuedAtText, signature] = raw.split(".");
  if (!account || !issuedAtText || !signature) return false;
  if (account !== adminAccount()) return false;

  const issuedAt = Number(issuedAtText);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > SESSION_TTL_MS) {
    return false;
  }

  return safeEqual(signature, sign(`${account}.${issuedAtText}`));
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized admin action");
  }
}
