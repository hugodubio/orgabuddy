import Link from "next/link";
import { format } from "date-fns";
import { CalendarCheck2, Music4, Sparkles, UsersRound } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { RehearsalCard } from "@/components/rehearsals/rehearsal-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/db/queries";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const data = await getDashboardData(user.id, user.role);

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Visão geral"
        title="Mantém todas as bandas alinhadas"
        description="Quem ainda não submeteu disponibilidade, quais os melhores slots e o que já está confirmado."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bandas" value={data.totalBands} icon={Music4} />
        <StatCard label="Membros" value={data.totalMembers} icon={UsersRound} />
        <StatCard label="Ensaios esta semana" value={data.confirmedThisWeek} icon={CalendarCheck2} />
        <StatCard
          label="Sem disponibilidade"
          value={data.missingAvailability}
          icon={Sparkles}
          hint={data.missingAvailability > 0 ? "Não é possível gerar sugestões fiáveis sem estas disponibilidades" : "Todos submeteram — as sugestões são fiáveis"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Próximos ensaios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcomingRehearsals.length ? (
              data.upcomingRehearsals.map((rehearsal) => (
                <RehearsalCard key={rehearsal.id} rehearsal={rehearsal} canManage={user.role === "ADMIN"} />
              ))
            ) : (
              <EmptyState title="Nenhum ensaio confirmado ainda" description="Gera sugestões a partir das disponibilidades e confirma o melhor slot." />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>À espera de disponibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.missingAvailabilityMembers.length ? (
                data.missingAvailabilityMembers.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Todos submeteram esta semana. As sugestões têm precisão máxima.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Melhores slots agora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.topSuggestions.length ? (
                data.topSuggestions.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    href={`/bands/${suggestion.bandId}/suggestions`}
                    className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{suggestion.band.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(suggestion.startAt, "EEE, MMM d")} · {format(suggestion.startAt, "HH:mm")}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-primary">{suggestion.score} pts</div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma sugestão ainda. Abre uma banda, garante que as disponibilidades estão submetidas e clica em Gerar.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
