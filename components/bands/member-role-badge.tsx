import { Badge } from "@/components/ui/badge";

export function MemberRoleBadge({ roleName }: { roleName?: string | null }) {
  return <Badge variant="secondary">{roleName || "General"}</Badge>;
}
