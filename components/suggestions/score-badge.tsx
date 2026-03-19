import { Badge } from "@/components/ui/badge";

export function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 150 ? "success" : score >= 120 ? "default" : "warning";
  return <Badge variant={variant}>{score} pts</Badge>;
}
