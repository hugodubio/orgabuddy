import { startOfWeek } from "date-fns";
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
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      userId: {
        in: band.members.map((member) => member.userId),
      },
      startAt: {
        gte: weekStart,
      },
    },
  });

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Band Availability"
        title={`${band.name} overlap`}
        description="See where the roster lines up before you ask the engine to rank the best rehearsal windows."
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
        <EmptyState title="No members yet" description="Add members first so the heatmap can show meaningful overlap." />
      )}
    </PageContainer>
  );
}
