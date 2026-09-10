import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME, getAdminCookieOptions } from "@/lib/auth/session";
import type { ApiResponse } from "@/types/api";

export async function POST(): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  const cookieOpts = getAdminCookieOptions();

  const response = NextResponse.json({
    success: true as const,
    data: { message: "Yönetici oturumu kapatıldı." },
  });

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: 0,
  });

  return response;
}
