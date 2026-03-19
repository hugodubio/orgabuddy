export function AvailabilityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-accent/70" />
        Available
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-primary/70" />
        Preferred
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-white/15" />
        Empty
      </div>
    </div>
  );
}
