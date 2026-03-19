"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, CalendarRange, LayoutDashboard, Music4, Settings, Sparkles, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bands", label: "Bands", icon: Music4 },
  { href: "/availability", label: "Availability", icon: CalendarRange },
  { href: "/suggestions", label: "Suggestions", icon: Sparkles },
  { href: "/rehearsals", label: "Rehearsals", icon: CalendarCheck2 },
  { href: "/members", label: "Members", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  user,
}: {
  user: {
    name: string;
    email: string;
    role: "ADMIN" | "MEMBER";
  };
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-black/20 px-5 py-6 backdrop-blur-xl lg:flex">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 via-white/[0.02] to-accent/10 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-primary/70">OrgaBuddy</p>
        <h2 className="mt-3 text-2xl font-semibold">Rehearsal control room</h2>
        <p className="mt-2 text-sm text-muted-foreground">Find overlap fast, lock rehearsals quickly, keep every band moving.</p>
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                isActive ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
        </div>
      </div>
    </aside>
  );
}
