import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "kmos_admin_session";
const SESSION_LENGTH_SECONDS = 60 * 60 * 12;

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left ?? "");
  const rightBuffer = Buffer.from(right ?? "");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(payload) {
  return crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "").update(payload).digest("base64url");
}

export function adminAuthConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32);
}

export function validateAdminCredentials(email, password) {
  if (!adminAuthConfigured()) return false;
  return safeEqual(String(email).trim().toLowerCase(), process.env.ADMIN_EMAIL.trim().toLowerCase()) && safeEqual(String(password), process.env.ADMIN_PASSWORD);
}

export function createAdminSessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_LENGTH_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token) {
  if (!adminAuthConfigured() || !token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    return Number(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: SESSION_LENGTH_SECONDS
  };
}
