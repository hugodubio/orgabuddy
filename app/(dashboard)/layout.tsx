import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1700px]">
        <AppSidebar user={user} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AppHeader user={user} />
          <main className="flex-1 px-4 pb-8 pt-4 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
