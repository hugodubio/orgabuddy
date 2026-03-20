import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Definições"
        title="As tuas preferências"
        description="Mantém as preferências de agendamento simples para que o planeamento seja rápido."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={user.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} readOnly />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferências de agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Fuso horário</Label>
              <Input value={user.timezone} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Duração padrão de ensaio</Label>
              <Input value={`${user.defaultDurationMin} minutos`} readOnly />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
