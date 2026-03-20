import { addDays, startOfWeek } from "date-fns";
import { BandAvailabilityHeatmap } from "@/components/availability/band-availability-heatmap";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { prisma } from "@/lib/db/prisma";
import { getBandDetail } from "@/lib/db/queries";
import { notFound } from "next/navigation";

export default async function BandAvailabilityPage({ params }: { params: Promise<{ bandId: string }> }) {
  const { bandId } = await params;
  const band = await getBandDetail(bandId);
  if (!band) notFound();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      userId: {
        in: band.members.map((member) => member.userId),
      },
      startAt: { gte: weekStart },
      endAt: { lte: weekEnd },
    },
  });

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Disponibilidade da Banda"
        title={`Overlap de ${band.name}`}
        description="Vê onde os horários coincidem antes de gerar os melhores slots de ensaio."
      />
      {band.members.length ? (
        <BandAvailabilityHeatmap
          weekStart={weekStart}
          members={band.members.map((member) => ({
            userId: member.userId,
            name: member.user.name,
            isRequired: member.isRequired,
          }))}
          blocks={blocks}
        />
      ) : (
        <EmptyState title="Sem membros ainda" description="Adiciona membros primeiro para o heatmap mostrar o overlap." />
      )}
    </PageContainer>
  );
}
