import { Badge } from "@/components/ui/badge";

type MatrixMember = {
  memberId: string;
  name: string;
  roleName?: string | null;
  isRequired: boolean;
  isAvailable: boolean;
  blockedByConflict?: boolean;
};

export function MemberAvailabilityMatrix({ members }: { members: MatrixMember[] }) {
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member.memberId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{member.name}</p>
              {member.isRequired ? <Badge variant="default">Essencial</Badge> : <Badge variant="secondary">Opcional</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{member.roleName || "Sem instrumento"}</p>
          </div>
          <Badge variant={member.isAvailable ? "success" : "destructive"}>
            {member.isAvailable ? "Disponível" : member.blockedByConflict ? "Conflito" : "Indisponível"}
          </Badge>
        </div>
      ))}
    </div>
  );
}
