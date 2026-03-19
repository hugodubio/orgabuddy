import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterBar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3", className)}>{children}</div>;
}
