import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DEV_AUTH_COOKIE } from "@/lib/auth/config";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;

  if (!payload?.email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "No account found for that email." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEV_AUTH_COOKIE, user.email, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
