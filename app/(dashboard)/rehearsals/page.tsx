import { RehearsalCalendar } from "@/components/rehearsals/rehearsal-calendar";
import { RehearsalCard } from "@/components/rehearsals/rehearsal-card";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const bandColors = ["#ec7b2c", "#2bb98a", "#4da3ff", "#f5b642", "#ec5a88"];

export default async function RehearsalsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rehearsals = await prisma.rehearsal.findMany({
    where: {
      status: "CONFIRMED",
      ...(user.role === "MEMBER"
        ? {
            band: {
              members: {
                some: {
                  userId: user.id,
                },
              },
            },
          }
        : {}),
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
        eyebrow="Global Calendar"
        title="All confirmed rehearsals"
        description="This is the final schedule view across bands, color coded so conflicts and free windows stay obvious."
      />
      <RehearsalCalendar
        events={rehearsals.map((rehearsal, index) => ({
          id: rehearsal.id,
          title: rehearsal.band.name,
          start: rehearsal.startAt,
          end: rehearsal.endAt,
          backgroundColor: bandColors[index % bandColors.length],
          borderColor: bandColors[index % bandColors.length],
        }))}
      />
      <div className="space-y-4">
        {rehearsals.map((rehearsal) => (
          <RehearsalCard key={rehearsal.id} rehearsal={rehearsal} canManage={user.role === "ADMIN"} />
        ))}
      </div>
    </PageContainer>
  );
}
