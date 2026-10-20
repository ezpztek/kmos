"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminCookieOptions, createAdminSessionToken, validateAdminCredentials } from "@/lib/admin-auth";

export async function loginAdmin(formData) {
  if (!validateAdminCredentials(formData.get("email"), formData.get("password"))) redirect("/@dm1n?error=invalid");
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createAdminSessionToken(), adminCookieOptions());
  redirect("/@dm1n");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
  redirect("/@dm1n");
}
