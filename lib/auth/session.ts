import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { DEV_AUTH_COOKIE, hasSupabaseEnv } from "@/lib/auth/config";
import { createSupabaseServerClient } from "@/lib/auth/supabase";

export const getCurrentUser = cache(async () => {
  if (!hasSupabaseEnv()) {
    const cookieStore = await cookies();
    const email = cookieStore.get(DEV_AUTH_COOKIE)?.value;

    if (!email) {
      return null;
    }

    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: authUser.email,
    },
  });

  return user;
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireCurrentUser();

  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return user;
}
