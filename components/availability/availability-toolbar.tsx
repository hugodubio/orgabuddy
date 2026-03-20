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
        Disponível
      </Button>
      <Button variant={mode === "PREFERRED" ? "default" : "outline"} size="sm" onClick={() => onModeChange("PREFERRED")}>
        Preferido
      </Button>
      <Button variant="outline" size="sm" onClick={onWeekdayEvenings}>
        Noites de semana
      </Button>
      <Button variant="outline" size="sm" onClick={onWeekends}>
        Fins de semana
      </Button>
      <Button variant="outline" size="sm" onClick={onCopyPrevious}>
        Copiar semana anterior
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Limpar semana
      </Button>
    </div>
  );
}
