import { confirmRehearsal } from "@/lib/db/actions";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { RehearsalCalendar } from "@/components/rehearsals/rehearsal-calendar";
import { RehearsalCard } from "@/components/rehearsals/rehearsal-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getBandDetail } from "@/lib/db/queries";
import { notFound } from "next/navigation";

export default async function BandRehearsalsPage({ params }: { params: Promise<{ bandId: string }> }) {
  const { bandId } = await params;
  const [user, band] = await Promise.all([getCurrentUser(), getBandDetail(bandId)]);

  if (!user || !band) {
    notFound();
  }

  const rehearsals = await prisma.rehearsal.findMany({
    where: {
      bandId,
      status: "CONFIRMED",
    },
    include: {
      band: true,
    },
    orderBy: {
      startAt: "asc",
    },
  });

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Ensaios"
        title={`Calendário de ${band.name}`}
        description="Os ensaios confirmados ficam aqui separados da disponibilidade, para todos verem o horário real."
      />
      {user.role === "ADMIN" ? (
        <Card>
          <CardHeader>
            <CardTitle>Criar ensaio manual</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                const date = String(formData.get("date"));
                const start = String(formData.get("start"));
                const end = String(formData.get("end"));
                await confirmRehearsal({
                  bandId,
                  startAt: new Date(`${date}T${start}:00`),
                  endAt: new Date(`${date}T${end}:00`),
                  notes: String(formData.get("notes") || ""),
                });
              }}
              className="grid gap-4 md:grid-cols-4"
            >
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start">Início</Label>
                <Input id="start" name="start" type="time" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Fim</Label>
                <Input id="end" name="end" type="time" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" placeholder="Objetivos da sessão" />
              </div>
              <div className="md:col-span-4">
                <Button type="submit">Criar ensaio</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
      {rehearsals.length ? (
        <>
          <RehearsalCalendar
            events={rehearsals.map((rehearsal) => ({
              id: rehearsal.id,
              title: band.name,
              start: rehearsal.startAt,
              end: rehearsal.endAt,
              backgroundColor: "#ec7b2c",
              borderColor: "#ec7b2c",
            }))}
          />
          <div className="space-y-4">
            {rehearsals.map((rehearsal) => (
              <RehearsalCard key={rehearsal.id} rehearsal={rehearsal} canManage={user.role === "ADMIN"} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="Sem ensaios confirmados" description="Confirma uma sugestão para popular o calendário desta banda." />
      )}
    </PageContainer>
  );
}
