import { format } from "date-fns";
import { MemberAvailabilityMatrix } from "@/components/suggestions/member-availability-matrix";
import { ScoreBadge } from "@/components/suggestions/score-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DetailMetadata = {
  members: Array<{
    memberId: string;
    name: string;
    roleName?: string | null;
    isRequired: boolean;
    isAvailable: boolean;
    blockedByConflict?: boolean;
  }>;
  preferredMembersCount?: number;
  nearbyConflictPressure?: number;
  summary?: string;
};

export function SuggestionDetailPanel({
  suggestion,
}: {
  suggestion:
    | {
        startAt: Date;
        endAt: Date;
        score: number;
        availableMembersCount: number;
        requiredMembersAvailable: boolean;
        metadata: DetailMetadata | null;
      }
    | null;
}) {
  if (!suggestion) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Seleciona uma sugestão para ver os detalhes de cada membro e perceber porque este slot ficou bem classificado.</CardContent>
      </Card>
    );
  }

  const metadata = suggestion.metadata;

  return (
    <Card className="sticky top-24">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{format(suggestion.startAt, "EEEE, MMMM d")}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {format(suggestion.startAt, "HH:mm")} - {format(suggestion.endAt, "HH:mm")}
            </p>
          </div>
          <ScoreBadge score={suggestion.score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">{suggestion.availableMembersCount} membros livres</Badge>
          <Badge variant={suggestion.requiredMembersAvailable ? "default" : "destructive"}>
            {suggestion.requiredMembersAvailable ? "Todos os essenciais disponíveis" : "Faltam essenciais"}
          </Badge>
          {metadata?.preferredMembersCount ? <Badge variant="secondary">{metadata.preferredMembersCount} preferidos</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {metadata?.summary || "Este slot mantém os membros essenciais disponíveis e evita conflitos com ensaios confirmados."}
        </p>
        <MemberAvailabilityMatrix members={metadata?.members ?? []} />
      </CardContent>
    </Card>
  );
}
