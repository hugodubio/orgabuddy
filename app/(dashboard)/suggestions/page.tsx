import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Users2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreBadge } from "@/components/suggestions/score-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function SuggestionsIndexPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const suggestions = await prisma.rehearsalSuggestion.findMany({
    where:
      user.role === "ADMIN"
        ? undefined
        : {
            band: {
              members: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
    include: {
      band: true,
    },
    orderBy: [{ score: "desc" }, { startAt: "asc" }],
  });

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Suggestions"
        title="Best slots across all bands"
        description="Pending decisions grouped by score. Click a band to compare options and confirm."
      />
      {suggestions.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {suggestions.map((suggestion) => (
            <Link key={suggestion.id} href={`/bands/${suggestion.bandId}/suggestions`} className="block group">
              <Card className="transition group-hover:bg-white/[0.05]">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{suggestion.band.name}</p>
                      <ScoreBadge score={suggestion.score} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {format(suggestion.startAt, "EEE, MMM d")} · {format(suggestion.startAt, "HH:mm")}–{format(suggestion.endAt, "HH:mm")}
                      </p>
                      <Badge variant="secondary">
                        <Users2 className="mr-1 h-3 w-3" />
                        {suggestion.availableMembersCount} free
                      </Badge>
                      {suggestion.requiredMembersAvailable ? (
                        <Badge variant="success">Required covered</Badge>
                      ) : (
                        <Badge variant="destructive">Missing core players</Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No suggestions yet"
          description="Open a band, make sure members have submitted availability, then hit Generate to rank the best slots."
        />
      )}
    </PageContainer>
  );
}
