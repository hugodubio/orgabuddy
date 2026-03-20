"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { hasSupabaseEnv } from "@/lib/auth/config";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/bands": "Bandas",
  "/availability": "Disponibilidade",
  "/rehearsals": "Ensaios",
  "/settings": "Definições",
};

function getTitle(pathname: string) {
  if (pathname.includes("/suggestions")) return "Sugestões";
  if (pathname.includes("/members")) return "Membros";
  if (pathname.includes("/rehearsals") && pathname !== "/rehearsals") return "Ensaios da Banda";
  if (pathname.includes("/availability") && pathname !== "/availability") return "Disponibilidade da Banda";
  if (pathname.startsWith("/bands/")) return "Visão Geral da Banda";
  return pageTitles[pathname] ?? "OrgaBuddy";
}

export function AppHeader({
  user,
}: {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "MEMBER";
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
          <MobileNav user={user} />
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary/75">Agenda de Estúdio</p>
            <h1 className="text-xl font-semibold">{getTitle(pathname)}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/bands"
            className="hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground md:flex md:items-center md:gap-2"
          >
            <Search className="h-4 w-4" />
            Ir para bandas
          </Link>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
          <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground xl:block">
            Sessão: {user.name}
          </div>
        </div>
      </div>
    </header>
  );
}
