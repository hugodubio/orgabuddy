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
        <Button size="sm">Confirm rehearsal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm rehearsal</DialogTitle>
          <DialogDescription>
            Lock this suggestion into the final rehearsal calendar for {format(startAt, "EEEE, MMM d")} from{" "}
            {format(startAt, "HH:mm")} to {format(endAt, "HH:mm")}.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            onClick={() =>
              startTransition(async () => {
                try {
                  await confirmRehearsal({ bandId, suggestionId, startAt, endAt });
                  toast.success("Rehearsal confirmed.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to confirm rehearsal.");
                }
              })
            }
            disabled={isPending}
          >
            {isPending ? "Confirming..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
