import { Plus } from "lucide-react";
import { BandsDirectory } from "@/components/bands/bands-directory";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/auth/session";
import { createBand } from "@/lib/db/actions";
import { getSidebarBands } from "@/lib/db/queries";

export default async function BandsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const bands = await getSidebarBands(user.id, user.role);

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Bandas"
        title="Gere os teus espaços de ensaio"
        description="Cria bandas, gere membros e inicia o agendamento sem perder a visão global."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {bands.length ? (
          <BandsDirectory bands={bands} />
        ) : (
          <EmptyState
            title="Nenhuma banda ainda"
            description="Cria a tua primeira banda para começar a recolher disponibilidades e gerar sugestões de ensaios."
          />
        )}

        {user.role === "ADMIN" ? (
          <Card>
            <CardHeader>
              <CardTitle>Criar banda</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createBand} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da banda</Label>
                  <Input id="name" name="name" placeholder="Night Owls" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" placeholder="Contexto breve para o planeamento de ensaios desta banda..." />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4" />
                  Criar banda
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageContainer>
  );
}
