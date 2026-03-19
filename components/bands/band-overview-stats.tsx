import { CalendarClock, CircleCheckBig, Users2 } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";

export function BandOverviewStats({
  membersCount,
  requiredCount,
  optionalCount,
  nextRehearsal,
}: {
  membersCount: number;
  requiredCount: number;
  optionalCount: number;
  nextRehearsal?: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Members" value={membersCount} icon={Users2} hint="Active roster in this band" />
      <StatCard label="Required" value={requiredCount} icon={CircleCheckBig} hint="Needed for a valid suggestion" />
      <StatCard label="Optional" value={optionalCount} icon={CircleCheckBig} hint="Helpful but not mandatory" />
      <StatCard label="Next rehearsal" value={nextRehearsal ?? "None"} icon={CalendarClock} hint="Next confirmed session" />
    </div>
  );
}
