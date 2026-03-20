"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { confirmRehearsal } from "@/lib/db/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ConfirmRehearsalDialog({
  bandId,
  suggestionId,
  startAt,
  endAt,
}: {
  bandId: string;
  suggestionId?: string;
  startAt: Date;
  endAt: Date;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Confirmar ensaio</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar ensaio</DialogTitle>
          <DialogDescription>
            Confirmar este slot no calendário de ensaios para {format(startAt, "EEEE, MMM d")} das{" "}
            {format(startAt, "HH:mm")} às {format(endAt, "HH:mm")}.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            onClick={() =>
              startTransition(async () => {
                try {
                  await confirmRehearsal({ bandId, suggestionId, startAt, endAt });
                  toast.success("Ensaio confirmado.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Não foi possível confirmar o ensaio.");
                }
              })
            }
            disabled={isPending}
          >
            {isPending ? "A confirmar..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
