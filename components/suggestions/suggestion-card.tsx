import { format } from "date-fns";
import { Clock3, Users2 } from "lucide-react";
import { ConfirmRehearsalDialog } from "@/components/rehearsals/confirm-rehearsal-dialog";
import { ScoreBadge } from "@/components/suggestions/score-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SuggestionCardProps = {
  bandId: string;
  selected?: boolean;
  onSelect?: () => void;
  suggestion: {
    id: string;
    startAt: Date;
    endAt: Date;
    score: number;
    availableMembersCount: number;
    requiredMembersAvailable: boolean;
  };
  canConfirm: boolean;
};

export function SuggestionCard({ bandId, suggestion, selected, onSelect, canConfirm }: SuggestionCardProps) {
  return (
    <Card className={cn("cursor-pointer transition hover:bg-white/[0.05]", selected && "border-primary/40 bg-primary/10")} onClick={onSelect}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{format(suggestion.startAt, "EEEE, MMM d")}</p>
            <p className="text-sm text-muted-foreground">
              {format(suggestion.startAt, "HH:mm")} - {format(suggestion.endAt, "HH:mm")}
            </p>
          </div>
          <ScoreBadge score={suggestion.score} />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">
            <Users2 className="mr-1 h-3.5 w-3.5" />
            {suggestion.availableMembersCount} livres
          </Badge>
          <Badge variant={suggestion.requiredMembersAvailable ? "success" : "destructive"}>
            <Clock3 className="mr-1 h-3.5 w-3.5" />
            {suggestion.requiredMembersAvailable ? "Essenciais disponíveis" : "Faltam essenciais"}
          </Badge>
        </div>
        {canConfirm ? (
          <div onClick={(event) => event.stopPropagation()}>
            <ConfirmRehearsalDialog
              bandId={bandId}
              suggestionId={suggestion.id}
              startAt={suggestion.startAt}
              endAt={suggestion.endAt}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
