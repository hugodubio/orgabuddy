import Link from "next/link";
import { format } from "date-fns";
import { CalendarClock, ChevronRight, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type BandCardProps = {
  band: {
    id: string;
    name: string;
    description: string | null;
    members: Array<{ isRequired: boolean }>;
    rehearsals: Array<{ startAt: Date }>;
  };
};

export function BandCard({ band }: BandCardProps) {
  const nextRehearsal = band.rehearsals[0];
  const requiredCount = band.members.filter((member) => member.isRequired).length;

  return (
    <Card className="group overflow-hidden">
      <CardHeader className="border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{band.name}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{band.description || "Sem descrição ainda."}</p>
          </div>
          <Badge>{requiredCount} essenciais</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users2 className="h-4 w-4" />
              Membros
            </div>
            <p className="mt-3 text-2xl font-semibold">{band.members.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              Próximo ensaio
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              {nextRehearsal ? format(nextRehearsal.startAt, "EEE, MMM d 'às' HH:mm") : "Nenhum confirmado"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Espaço da banda</p>
          <Button asChild variant="outline">
            <Link href={`/bands/${band.id}`}>
              Abrir
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
