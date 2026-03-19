import { cn } from "@/lib/utils";

export function AvailabilityCell({
  active,
  preferred,
  dimmed,
}: {
  active: boolean;
  preferred?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      className={cn(
        "h-6 rounded-[6px] border transition",
        active
          ? preferred
            ? "border-primary/40 bg-primary/60"
            : "border-accent/40 bg-accent/60"
          : dimmed
            ? "border-white/5 bg-white/[0.02]"
            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]",
      )}
    />
  );
}
