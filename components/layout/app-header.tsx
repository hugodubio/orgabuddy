"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeft, Search } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { hasSupabaseEnv } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/bands": "Bands",
  "/availability": "Availability",
  "/rehearsals": "Rehearsals",
  "/settings": "Settings",
};

function getTitle(pathname: string) {
  if (pathname.includes("/suggestions")) return "Suggestions";
  if (pathname.includes("/members")) return "Members";
  if (pathname.includes("/rehearsals") && pathname !== "/rehearsals") return "Band Rehearsals";
  if (pathname.includes("/availability") && pathname !== "/availability") return "Band Availability";
  if (pathname.startsWith("/bands/")) return "Band Overview";
  return pageTitles[pathname] ?? "OrgaBuddy";
}

export function AppHeader({
  user,
}: {
  user: {
    name: string;
  };
}) {
  const pathname = usePathname();

  async function handleSignOut() {
    if (hasSupabaseEnv()) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } else {
      await fetch("/api/dev-logout", {
        method: "POST",
      });
    }
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-background/80 px-4 py-4 backdrop-blur-xl md:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-muted-foreground lg:hidden">
            <PanelLeft className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary/75">Studio Schedule</p>
            <h1 className="text-xl font-semibold">{getTitle(pathname)}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/bands"
            className="hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground md:flex md:items-center md:gap-2"
          >
            <Search className="h-4 w-4" />
            Jump to bands
          </Link>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
          <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground xl:block">
            Signed in as {user.name}
          </div>
        </div>
      </div>
    </header>
  );
}
