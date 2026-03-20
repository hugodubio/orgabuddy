const MIN_SCORE = 60;
const MAX_SCORE = 200;

export function ScoreBadge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, ((score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100));

  const color =
    pct >= 66
      ? { bar: "bg-emerald-500", glow: "shadow-emerald-500/30", label: "text-emerald-400" }
      : pct >= 33
        ? { bar: "bg-amber-400", glow: "shadow-amber-400/30", label: "text-amber-400" }
        : { bar: "bg-red-500", glow: "shadow-red-500/30", label: "text-red-400" };

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full shadow-sm transition-all duration-500 ${color.bar} ${color.glow}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium tabular-nums ${color.label}`}>{Math.round(pct)}%</span>
    </div>
  );
}
