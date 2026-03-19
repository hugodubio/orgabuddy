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
        eyebrow="Overview"
        title="Keep every band aligned"
        description="Who hasn't submitted availability, which slots are strongest right now, and what's already locked in."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bands" value={data.totalBands} icon={Music4} />
        <StatCard label="Members" value={data.totalMembers} icon={UsersRound} />
        <StatCard label="Rehearsals this week" value={data.confirmedThisWeek} icon={CalendarCheck2} />
        <StatCard
          label="Missing availability"
          value={data.missingAvailability}
          icon={Sparkles}
          hint={data.missingAvailability > 0 ? "Can't generate reliable suggestions until these are filled" : "Everyone's in — suggestions are reliable"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming rehearsals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcomingRehearsals.length ? (
              data.upcomingRehearsals.map((rehearsal) => (
                <RehearsalCard key={rehearsal.id} rehearsal={rehearsal} canManage={user.role === "ADMIN"} />
              ))
            ) : (
              <EmptyState title="No confirmed rehearsals yet" description="Generate suggestions from availability and confirm the best slot to start filling the calendar." />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Waiting for availability</CardTitle>
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
                <p className="text-sm text-muted-foreground">All members submitted this week. Suggestions are at full accuracy.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best slots right now</CardTitle>
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
                <p className="text-sm text-muted-foreground">No suggestions yet. Open a band page, make sure availability is in, and hit Generate.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
