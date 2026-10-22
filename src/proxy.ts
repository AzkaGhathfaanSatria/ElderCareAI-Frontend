import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Frontend sekarang tidak lagi menerbitkan/mengecek JWT sendiri.
 * Autentikasi dan RBAC menjadi tanggung jawab Express API.
 *
 * Jangan memverifikasi cookie backend di sini karena API dapat berjalan pada
 * origin/domain berbeda dari Next.js. Halaman mengambil session dari GET /me
 * dan backend tetap menjadi sumber kebenaran untuk authorization.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/elderly/:path*",
    "/notifications/:path*",
    "/access/:path*",
    "/devices/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
