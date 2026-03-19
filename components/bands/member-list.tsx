import { removeBandMember, updateBandMemberRequiredStatus } from "@/lib/db/actions";
import { MemberRoleBadge } from "@/components/bands/member-role-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MemberListProps = {
  bandId: string;
  canManage: boolean;
  members: Array<{
    id: string;
    userId: string;
    roleName: string | null;
    isRequired: boolean;
    user: {
      name: string;
      email: string;
    };
  }>;
};

export function MemberList({ bandId, members, canManage }: MemberListProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <p className="font-medium">{member.user.name}</p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </TableCell>
              <TableCell>
                <MemberRoleBadge roleName={member.roleName} />
              </TableCell>
              <TableCell>
                {canManage ? (
                  <form
                    action={async () => {
                      "use server";
                      await updateBandMemberRequiredStatus({
                        bandMemberId: member.id,
                        isRequired: !member.isRequired,
                      });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Switch checked={member.isRequired} />
                      <Button variant="ghost" size="sm" type="submit">
                        {member.isRequired ? "Make optional" : "Make required"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Badge variant={member.isRequired ? "default" : "secondary"}>{member.isRequired ? "Required" : "Optional"}</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={member.isRequired ? "success" : "warning"}>{member.isRequired ? "Core" : "Flexible"}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {canManage ? (
                  <form
                    action={async () => {
                      "use server";
                      await removeBandMember(member.id, bandId);
                    }}
                  >
                    <Button variant="ghost" size="sm" type="submit">
                      Remove
                    </Button>
                  </form>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
