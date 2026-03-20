import { startOfWeek } from "date-fns";
import { WeeklyAvailabilityGrid } from "@/components/availability/weekly-availability-grid";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getAvailabilityForWeek } from "@/lib/db/actions";

export default async function AvailabilityPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const blocks = await getAvailabilityForWeek(weekStart);

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Disponibilidade"
        title="Pinta a tua semana"
        description="O coração do agendamento. Marca os teus horários livres para que as sugestões funcionem bem."
      />
      <WeeklyAvailabilityGrid initialWeekStart={weekStart} initialBlocks={blocks} />
    </PageContainer>
  );
}
