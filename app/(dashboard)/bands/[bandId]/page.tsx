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
        eyebrow="Band Overview"
        title={band.name}
        description={band.description || "This band is ready for structured rehearsal planning."}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/bands/${band.id}/members`}>
                <UsersRound className="h-4 w-4" />
                Manage members
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/bands/${band.id}/availability`}>
                <CalendarRange className="h-4 w-4" />
                Band availability
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/bands/${band.id}/suggestions`}>
                <Sparkles className="h-4 w-4" />
                Suggestions
              </Link>
            </Button>
          </div>
        }
      />

      <BandOverviewStats
        membersCount={band.members.length}
        requiredCount={requiredCount}
        optionalCount={optionalCount}
        nextRehearsal={band.rehearsals[0] ? format(band.rehearsals[0].startAt, "EEE, MMM d 'at' HH:mm") : undefined}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/bands/${band.id}/members`}>Manage members</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/bands/${band.id}/availability`}>Open availability</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/bands/${band.id}/suggestions`}>Generate suggestions</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/bands/${band.id}/rehearsals`}>View rehearsals</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roster snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {band.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="font-medium">{member.user.name}</p>
                  <p className="text-sm text-muted-foreground">{member.roleName || "No role label"}</p>
                </div>
                <div className="text-sm text-muted-foreground">{member.isRequired ? "Required" : "Optional"}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
