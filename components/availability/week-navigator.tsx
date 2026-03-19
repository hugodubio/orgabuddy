"use client";

import { addWeeks, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WeekNavigator({
  weekStart,
  onChange,
}: {
  weekStart: Date;
  onChange: (date: Date) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onChange(addWeeks(weekStart, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium">
        {format(weekStart, "MMM d")} - {format(addWeeks(weekStart, 1), "MMM d")}
      </div>
      <Button variant="outline" size="icon" onClick={() => onChange(addWeeks(weekStart, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
