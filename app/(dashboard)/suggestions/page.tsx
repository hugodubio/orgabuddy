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
        eyebrow="Sugestões"
        title="Melhores slots em todas as bandas"
        description="Decisões pendentes ordenadas por pontuação. Clica numa banda para comparar e confirmar."
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
                        {suggestion.availableMembersCount} livres
                      </Badge>
                      {suggestion.requiredMembersAvailable ? (
                        <Badge variant="success">Essenciais disponíveis</Badge>
                      ) : (
                        <Badge variant="destructive">Faltam membros essenciais</Badge>
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
          title="Nenhuma sugestão ainda"
          description="Abre uma banda, garante que os membros submeteram disponibilidade e clica em Gerar para ordenar os melhores slots."
        />
      )}
    </PageContainer>
  );
}
