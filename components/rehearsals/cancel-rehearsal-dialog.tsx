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
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar ensaio</DialogTitle>
          <DialogDescription>Isto mantém o registo mas remove-o do agendamento ativo.</DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end">
          <Button
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                try {
                  await cancelRehearsal({ rehearsalId });
                  toast.success("Ensaio cancelado.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Não foi possível cancelar o ensaio.");
                }
              })
            }
            disabled={isPending}
          >
            {isPending ? "A cancelar..." : "Cancelar ensaio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
