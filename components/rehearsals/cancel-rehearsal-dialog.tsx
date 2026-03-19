"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cancelRehearsal } from "@/lib/db/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CancelRehearsalDialog({ rehearsalId }: { rehearsalId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Cancel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel rehearsal</DialogTitle>
          <DialogDescription>This keeps the record but removes it from active confirmed scheduling.</DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end">
          <Button
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                try {
                  await cancelRehearsal({ rehearsalId });
                  toast.success("Rehearsal cancelled.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to cancel rehearsal.");
                }
              })
            }
            disabled={isPending}
          >
            {isPending ? "Cancelling..." : "Cancel rehearsal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
