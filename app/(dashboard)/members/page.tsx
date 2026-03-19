import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const members = await prisma.user.findMany({
    include: {
      memberships: {
        include: {
          band: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Members"
        title="People across all bands"
        description="A lightweight global roster view so you can see who is spread across multiple projects."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="space-y-3 p-5">
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {member.memberships.length
                  ? member.memberships.map((membership) => (
                      <span key={membership.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                        {membership.band.name}
                      </span>
                    ))
                  : "No band memberships"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
