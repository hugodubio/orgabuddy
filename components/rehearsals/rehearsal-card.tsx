import { format } from "date-fns";
import { CancelRehearsalDialog } from "@/components/rehearsals/cancel-rehearsal-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function RehearsalCard({
  rehearsal,
  canManage,
}: {
  rehearsal: {
    id: string;
    startAt: Date;
    endAt: Date;
    status: "CONFIRMED" | "CANCELLED";
    notes: string | null;
    band: {
      name: string;
    };
  };
  canManage: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{rehearsal.band.name}</p>
            <Badge variant={rehearsal.status === "CONFIRMED" ? "success" : "destructive"}>{rehearsal.status === "CONFIRMED" ? "Confirmado" : "Cancelado"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(rehearsal.startAt, "EEE, MMM d")} · {format(rehearsal.startAt, "HH:mm")} - {format(rehearsal.endAt, "HH:mm")}
          </p>
          {rehearsal.notes ? <p className="text-sm text-muted-foreground">{rehearsal.notes}</p> : null}
        </div>
        {canManage && rehearsal.status === "CONFIRMED" ? <CancelRehearsalDialog rehearsalId={rehearsal.id} /> : null}
      </CardContent>
    </Card>
  );
}
