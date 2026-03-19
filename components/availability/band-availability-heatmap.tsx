"use client";

import { useMemo, useState } from "react";
import { addDays, addMinutes, format, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DAYS = 7;
const SLOTS = 24;

function slotDate(base: Date, day: number, slot: number) {
  return addMinutes(addDays(startOfDay(base), day), slot * 60);
}

export function BandAvailabilityHeatmap({
  weekStart,
  members,
  blocks,
}: {
  weekStart: Date;
  members: Array<{ userId: string; name: string; isRequired: boolean }>;
  blocks: Array<{ userId: string; startAt: Date; endAt: Date }>;
}) {
  const [filterMode, setFilterMode] = useState<"ALL" | "REQUIRED" | "INDIVIDUAL">("ALL");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("ALL");

  const visibleMembers = useMemo(() => {
    if (filterMode === "REQUIRED") {
      return members.filter((member) => member.isRequired);
    }

    if (filterMode === "INDIVIDUAL") {
      return members.filter((member) => member.userId === selectedMemberId);
    }

    return members;
  }, [filterMode, members, selectedMemberId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Band overlap heatmap</CardTitle>
        <p className="text-sm text-muted-foreground">Darker cells mean more members are free during that hour.</p>
        <div className="flex flex-wrap items-center gap-2 pt-3">
          <Button variant={filterMode === "ALL" ? "default" : "outline"} size="sm" onClick={() => setFilterMode("ALL")}>
            All members
          </Button>
          <Button variant={filterMode === "REQUIRED" ? "default" : "outline"} size="sm" onClick={() => setFilterMode("REQUIRED")}>
            Required only
          </Button>
          <Button variant={filterMode === "INDIVIDUAL" ? "default" : "outline"} size="sm" onClick={() => setFilterMode("INDIVIDUAL")}>
            Individual view
          </Button>
          {filterMode === "INDIVIDUAL" ? (
            <select
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              className="flex h-9 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-foreground"
            >
              <option value="ALL">Choose member</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-[70px_repeat(7,minmax(0,1fr))] gap-2">
          <div />
          {Array.from({ length: DAYS }, (_, day) => (
            <div key={day} className="rounded-2xl bg-white/[0.03] px-3 py-2 text-center text-sm font-medium">
              {format(addDays(weekStart, day), "EEE d")}
            </div>
          ))}
          {Array.from({ length: SLOTS }, (_, slot) => (
            <div className="contents" key={slot}>
              <div className="pt-2 text-xs text-muted-foreground">{format(slotDate(weekStart, 0, slot), "HH:mm")}</div>
              {Array.from({ length: DAYS }, (_, day) => {
                const cellStart = slotDate(weekStart, day, slot);
                const cellEnd = addMinutes(cellStart, 60);
                const availableCount = visibleMembers.filter((member) =>
                  blocks.some(
                    (block) =>
                      block.userId === member.userId &&
                      block.startAt <= cellStart &&
                      block.endAt >= cellEnd,
                  ),
                ).length;
                const ratio = visibleMembers.length ? availableCount / visibleMembers.length : 0;

                return (
                  <div
                    key={`${day}-${slot}`}
                    className={cn("h-10 rounded-xl border border-white/10", ratio === 0 && "bg-white/[0.03]")}
                    style={{
                      backgroundColor: ratio > 0 ? `rgba(236, 123, 44, ${0.12 + ratio * 0.6})` : undefined,
                    }}
                    title={`${availableCount}/${visibleMembers.length} members available`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
