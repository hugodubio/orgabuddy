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
        <CardContent className="p-8 text-sm text-muted-foreground">Select a suggestion to inspect each member and see why the slot ranked well.</CardContent>
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
          <Badge variant="success">{suggestion.availableMembersCount} members free</Badge>
          <Badge variant={suggestion.requiredMembersAvailable ? "default" : "destructive"}>
            {suggestion.requiredMembersAvailable ? "All required covered" : "Required gap"}
          </Badge>
          {metadata?.preferredMembersCount ? <Badge variant="secondary">{metadata.preferredMembersCount} preferred</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {metadata?.summary || "This slot keeps the required lineup intact and avoids existing confirmed conflicts."}
        </p>
        <MemberAvailabilityMatrix members={metadata?.members ?? []} />
      </CardContent>
    </Card>
  );
}
