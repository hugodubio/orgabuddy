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
        eyebrow="Availability"
        title="Paint your week"
        description="This is the scheduling heartbeat of the app. Mark real free time quickly so suggestions can do the heavy lifting."
      />
      <WeeklyAvailabilityGrid initialWeekStart={weekStart} initialBlocks={blocks} />
    </PageContainer>
  );
}
