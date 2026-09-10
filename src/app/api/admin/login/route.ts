import { NextRequest, NextResponse } from "next/server";
import {
  validateCredentials,
  createAdminSession,
  getAdminCookieOptions,
} from "@/lib/auth/session";
import type { ApiResponse } from "@/types/api";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body = await request.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_CREDENTIALS",
            message: "Kullanıcı adı ve şifre gereklidir.",
          },
        },
        { status: 400 }
      );
    }

    const isValid = validateCredentials(String(username), String(password));

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Geçersiz kullanıcı adı veya şifre. Lütfen tekrar deneyin.",
          },
        },
        { status: 401 }
      );
    }

    const sessionToken = createAdminSession();
    const cookieOpts = getAdminCookieOptions();

    const response = NextResponse.json({
      success: true as const,
      data: { message: "Yönetici girişi başarılı. Portföy AI kota kalkanı devre dışı bırakıldı." },
    });

    response.cookies.set({
      name: cookieOpts.name,
      value: sessionToken,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (error: unknown) {
    console.error("[NutriTrack AI] Admin login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Oturum açılırken bir hata oluştu.",
        },
      },
      { status: 500 }
    );
  }
}
