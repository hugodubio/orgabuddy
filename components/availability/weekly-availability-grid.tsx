"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addDays, addMinutes, addWeeks, format, isWithinInterval, setHours, setMinutes, startOfDay } from "date-fns";
import { toast } from "sonner";
import { getAvailabilityForWeek, saveAvailabilityBlocks } from "@/lib/db/actions";
import { cn } from "@/lib/utils";
import { AvailabilityCell } from "@/components/availability/availability-cell";
import { AvailabilityLegend } from "@/components/availability/availability-legend";
import { AvailabilityToolbar } from "@/components/availability/availability-toolbar";
import { WeekNavigator } from "@/components/availability/week-navigator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type GridStatus = "EMPTY" | "AVAILABLE" | "PREFERRED";

const DAYS = 7;
const SLOTS = 48;

function keyFor(day: number, slot: number) {
  return `${day}-${slot}`;
}

function slotToDate(weekStart: Date, dayIndex: number, slotIndex: number) {
  const base = addDays(startOfDay(weekStart), dayIndex);
  return addMinutes(base, slotIndex * 30);
}

function buildGridFromBlocks(weekStart: Date, blocks: Array<{ startAt: Date; endAt: Date; status: "AVAILABLE" | "PREFERRED" | "UNAVAILABLE" }>) {
  const nextGrid: Record<string, GridStatus> = {};
  for (let day = 0; day < DAYS; day += 1) {
    for (let slot = 0; slot < SLOTS; slot += 1) {
      const current = slotToDate(weekStart, day, slot);
      const matchingBlock = blocks.find((block) =>
        isWithinInterval(current, {
          start: new Date(block.startAt),
          end: addMinutes(new Date(block.endAt), -1),
        }),
      );

      nextGrid[keyFor(day, slot)] =
        matchingBlock?.status === "PREFERRED" ? "PREFERRED" : matchingBlock ? "AVAILABLE" : "EMPTY";
    }
  }
  return nextGrid;
}

export function WeeklyAvailabilityGrid({
  initialWeekStart,
  initialBlocks,
}: {
  initialWeekStart: Date;
  initialBlocks: Array<{
    startAt: Date;
    endAt: Date;
    status: "AVAILABLE" | "PREFERRED" | "UNAVAILABLE";
  }>;
}) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [paintMode, setPaintMode] = useState<"AVAILABLE" | "PREFERRED">("AVAILABLE");
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [grid, setGrid] = useState<Record<string, GridStatus>>(() => buildGridFromBlocks(initialWeekStart, initialBlocks));

  const hours = useMemo(() => Array.from({ length: 24 }, (_, hour) => format(setMinutes(setHours(new Date(), hour), 0), "HH:mm")), []);

  useEffect(() => {
    let mounted = true;

    startTransition(async () => {
      try {
        const blocks = await getAvailabilityForWeek(weekStart);
        if (mounted) {
          setGrid(buildGridFromBlocks(weekStart, blocks));
        }
      } catch {
        if (mounted) {
          setGrid(buildGridFromBlocks(weekStart, []));
          toast.error("Não foi possível carregar a disponibilidade. Tenta atualizar.");
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [weekStart]);

  function setCell(day: number, slot: number) {
    setGrid((current) => {
      const key = keyFor(day, slot);
      const existing = current[key];
      const nextStatus = existing === paintMode ? "EMPTY" : paintMode;
      return {
        ...current,
        [key]: nextStatus,
      };
    });
  }

  function applyPreset(predicate: (day: number, slot: number) => boolean, status: GridStatus) {
    setGrid((current) => {
      const next = { ...current };
      for (let day = 0; day < DAYS; day += 1) {
        for (let slot = 0; slot < SLOTS; slot += 1) {
          if (predicate(day, slot)) {
            next[keyFor(day, slot)] = status;
          }
        }
      }
      return next;
    });
  }

  function buildBlocks() {
    const blocks: Array<{ startAt: Date; endAt: Date; status: "AVAILABLE" | "PREFERRED" | "UNAVAILABLE" }> = [];

    for (let day = 0; day < DAYS; day += 1) {
      let slot = 0;
      while (slot < SLOTS) {
        const currentStatus = grid[keyFor(day, slot)];
        if (currentStatus === "EMPTY") {
          slot += 1;
          continue;
        }

        let endSlot = slot + 1;
        while (endSlot < SLOTS && grid[keyFor(day, endSlot)] === currentStatus) {
          endSlot += 1;
        }

        blocks.push({
          startAt: slotToDate(weekStart, day, slot),
          endAt: slotToDate(weekStart, day, endSlot),
          status: currentStatus === "PREFERRED" ? "PREFERRED" : "AVAILABLE",
        });

        slot = endSlot;
      }
    }

    return blocks;
  }

  async function handleSave() {
    startTransition(async () => {
      try {
        await saveAvailabilityBlocks({
          weekStart,
          blocks: buildBlocks(),
        });
        toast.success("Disponibilidade guardada.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível guardar a disponibilidade.");
      }
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-white/10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>Disponibilidade semanal</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">Pinta os teus horários livres diretamente na grelha. Sem formulários, só disponibilidade rápida.</p>
          </div>
          <WeekNavigator
            weekStart={weekStart}
            onChange={(nextWeek) => {
              setWeekStart(nextWeek);
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <AvailabilityToolbar
          mode={paintMode}
          onModeChange={setPaintMode}
          onClear={() => {
            const next: Record<string, GridStatus> = {};
            for (let day = 0; day < DAYS; day += 1) {
              for (let slot = 0; slot < SLOTS; slot += 1) {
                next[keyFor(day, slot)] = "EMPTY";
              }
            }
            setGrid(next);
          }}
          onWeekdayEvenings={() => applyPreset((day, slot) => day > 0 && day < 5 && slot >= 34 && slot <= 43, "AVAILABLE")}
          onWeekends={() => applyPreset((day, slot) => (day === 5 || day === 6) && slot >= 20 && slot <= 39, "AVAILABLE")}
          onCopyPrevious={() =>
            startTransition(async () => {
              try {
                const previousBlocks = await getAvailabilityForWeek(addWeeks(weekStart, -1));
                setGrid(buildGridFromBlocks(weekStart, previousBlocks));
                toast.success("Semana anterior copiada.");
              } catch {
                toast.error("Não foi possível carregar a semana anterior.");
              }
            })
          }
        />
        <AvailabilityLegend />

        <div
          className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0b0e14] p-3"
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={() => setIsDragging(false)}
        >
          <div className="grid min-w-[920px] grid-cols-[70px_repeat(7,minmax(0,1fr))] gap-2">
            <div />
            {Array.from({ length: DAYS }, (_, day) => (
              <div key={day} className="rounded-2xl bg-white/[0.03] px-3 py-2 text-center text-sm font-medium">
                {format(addDays(weekStart, day), "EEE d")}
              </div>
            ))}

            {Array.from({ length: SLOTS }, (_, slot) => {
              const showHourLabel = slot % 2 === 0;
              return (
                <div className="contents" key={slot}>
                  <div className="pt-1 text-xs text-muted-foreground">{showHourLabel ? hours[Math.floor(slot / 2)] : ""}</div>
                  {Array.from({ length: DAYS }, (_, day) => {
                    const status = grid[keyFor(day, slot)] ?? "EMPTY";
                    return (
                      <button
                        key={`${day}-${slot}`}
                        type="button"
                        className={cn("rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                        onMouseDown={() => {
                          setIsDragging(true);
                          setCell(day, slot);
                        }}
                        onMouseEnter={() => {
                          if (isDragging) {
                            setCell(day, slot);
                          }
                        }}
                      >
                        <AvailabilityCell active={status !== "EMPTY"} preferred={status === "PREFERRED"} />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "A guardar..." : "Guardar disponibilidade"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
