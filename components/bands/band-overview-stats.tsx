import { CalendarClock, CircleCheckBig, Users2 } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";

export function BandOverviewStats({
  membersCount,
  requiredCount,
  optionalCount,
  nextRehearsal,
}: {
  membersCount: number;
  requiredCount: number;
  optionalCount: number;
  nextRehearsal?: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Membros" value={membersCount} icon={Users2} hint="Roster ativo nesta banda" />
      <StatCard label="Essenciais" value={requiredCount} icon={CircleCheckBig} hint="Necessários para uma sugestão válida" />
      <StatCard label="Opcionais" value={optionalCount} icon={CircleCheckBig} hint="Úteis mas não obrigatórios" />
      <StatCard label="Próximo ensaio" value={nextRehearsal ?? "Nenhum"} icon={CalendarClock} hint="Próxima sessão confirmada" />
    </div>
  );
}
