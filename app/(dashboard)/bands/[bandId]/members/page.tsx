import { addBandMember } from "@/lib/db/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getBandDetail, getUsers } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { MemberList } from "@/components/bands/member-list";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function BandMembersPage({ params }: { params: Promise<{ bandId: string }> }) {
  const { bandId } = await params;
  const [user, band, users] = await Promise.all([getCurrentUser(), getBandDetail(bandId), getUsers()]);

  if (!user || !band) {
    notFound();
  }

  const availableUsers = users.filter((entry) => !band.members.some((member) => member.userId === entry.id));

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Members"
        title={`${band.name} roster`}
        description="Assign instruments, mark who is essential, and keep the scheduling engine grounded in reality."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <MemberList bandId={band.id} members={band.members} canManage={user.role === "ADMIN"} />
        {user.role === "ADMIN" ? (
          <Card>
            <CardHeader>
              <CardTitle>Add member</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={async (formData) => {
                  "use server";
                  await addBandMember({
                    bandId,
                    userId: String(formData.get("userId")),
                    roleName: String(formData.get("roleName") || ""),
                    isRequired: formData.get("isRequired") === "on",
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Select user</Label>
                  <select
                    name="userId"
                    className="flex h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-foreground"
                    defaultValue=""
                    required
                  >
                    <option value="" disabled>
                      Choose member
                    </option>
                    {availableUsers.map((availableUser) => (
                      <option key={availableUser.id} value={availableUser.id}>
                        {availableUser.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleName">Instrument / role</Label>
                  <Input id="roleName" name="roleName" placeholder="Drums" />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" name="isRequired" defaultChecked />
                  Required for scheduling
                </label>
                <Button type="submit" className="w-full">
                  Add to band
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageContainer>
  );
}
