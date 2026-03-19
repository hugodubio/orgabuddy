import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="space-y-2">
        {eyebrow ? <p className="text-xs uppercase tracking-[0.28em] text-primary/80">{eyebrow}</p> : null}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
          {description ? <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}
