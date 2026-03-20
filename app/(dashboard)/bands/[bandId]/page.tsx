import Link from "next/link";
import { format } from "date-fns";
import { CalendarRange, Music4, Sparkles, UsersRound } from "lucide-react";
import { BandOverviewStats } from "@/components/bands/band-overview-stats";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBandDetail } from "@/lib/db/queries";
import { notFound } from "next/navigation";

export default async function BandDetailPage({ params }: { params: Promise<{ bandId: string }> }) {
  const { bandId } = await params;
  const band = await getBandDetail(bandId);

  if (!band) {
    notFound();
  }

  const requiredCount = band.members.filter((member) => member.isRequired).length;
  const optionalCount = band.members.length - requiredCount;

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Visão Geral"
        title={band.name}
        description={band.description || "Esta banda está pronta para planeamento de ensaios."}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/bands/${band.id}/members`}>
                <UsersRound className="h-4 w-4" />
                Gerir membros
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/bands/${band.id}/availability`}>
                <CalendarRange className="h-4 w-4" />
                Disponibilidade
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/bands/${band.id}/suggestions`}>
                <Sparkles className="h-4 w-4" />
                Sugestões
              </Link>
            </Button>
          </div>
        }
      />

      <BandOverviewStats
        membersCount={band.members.length}
        requiredCount={requiredCount}
        optionalCount={optionalCount}
        nextRehearsal={band.rehearsals[0] ? format(band.rehearsals[0].startAt, "EEE, MMM d 'às' HH:mm") : undefined}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/bands/${band.id}/members`}>Gerir membros</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/bands/${band.id}/availability`}>Ver disponibilidade</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/bands/${band.id}/suggestions`}>Gerar sugestões</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/bands/${band.id}/rehearsals`}>Ver ensaios</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {band.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="font-medium">{member.user.name}</p>
                  <p className="text-sm text-muted-foreground">{member.roleName || "Sem instrumento"}</p>
                </div>
                <div className="text-sm text-muted-foreground">{member.isRequired ? "Essencial" : "Opcional"}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
