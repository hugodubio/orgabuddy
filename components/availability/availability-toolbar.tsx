"use client";

import { Button } from "@/components/ui/button";

export function AvailabilityToolbar({
  onClear,
  onWeekdayEvenings,
  onWeekends,
  onCopyPrevious,
  mode,
  onModeChange,
}: {
  onClear: () => void;
  onWeekdayEvenings: () => void;
  onWeekends: () => void;
  onCopyPrevious: () => void;
  mode: "AVAILABLE" | "PREFERRED";
  onModeChange: (mode: "AVAILABLE" | "PREFERRED") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={mode === "AVAILABLE" ? "default" : "outline"} size="sm" onClick={() => onModeChange("AVAILABLE")}>
        Paint available
      </Button>
      <Button variant={mode === "PREFERRED" ? "default" : "outline"} size="sm" onClick={() => onModeChange("PREFERRED")}>
        Paint preferred
      </Button>
      <Button variant="outline" size="sm" onClick={onWeekdayEvenings}>
        Weekday evenings
      </Button>
      <Button variant="outline" size="sm" onClick={onWeekends}>
        Weekends
      </Button>
      <Button variant="outline" size="sm" onClick={onCopyPrevious}>
        Copy previous week
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear week
      </Button>
    </div>
  );
}
