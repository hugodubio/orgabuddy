import { addWeeks, startOfWeek } from "date-fns";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GenerateSuggestionsButton } from "@/components/suggestions/generate-suggestions-button";
import { SuggestionDetailPanel } from "@/components/suggestions/suggestion-detail-panel";
import { SuggestionList } from "@/components/suggestions/suggestion-list";
import { generateBandSuggestions } from "@/lib/db/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getBandDetail } from "@/lib/db/queries";
import { notFound } from "next/navigation";

export default async function SuggestionsPage({ params }: { params: Promise<{ bandId: string }> }) {
  const { bandId } = await params;
  const [user, band] = await Promise.all([getCurrentUser(), getBandDetail(bandId)]);

  if (!user || !band) {
    notFound();
  }

  return (
    <PageContainer>
      <SectionHeader
        eyebrow="Sugestões"
        title={`Slots para ${band.name}`}
        description="Os melhores horários com base nas disponibilidades atuais, importância dos membros e conflitos com ensaios confirmados."
        action={
          user.role === "ADMIN" ? (
            <form
              action={async () => {
                "use server";
                const rangeStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                await generateBandSuggestions({
                  bandId,
                  rangeStart,
                  rangeEnd: addWeeks(rangeStart, 2),
                  durationMinutes: 120,
                });
              }}
            >
              <GenerateSuggestionsButton label="Gerar top 5" />
            </form>
          ) : null
        }
      />

      {band.suggestions.length ? (
        <SuggestionList
          bandId={band.id}
          suggestions={band.suggestions.map((suggestion) => ({
            ...suggestion,
            metadata:
              suggestion.metadata && typeof suggestion.metadata === "object"
                ? (suggestion.metadata as never)
                : null,
          }))}
          canConfirm={user.role === "ADMIN"}
          renderDetail={(selected) => (
            <SuggestionDetailPanel
              suggestion={
                selected
                  ? {
                      ...selected,
                      metadata: selected.metadata as never,
                    }
                  : null
              }
            />
          )}
        />
      ) : (
        <EmptyState
          title="Nenhuma sugestão válida ainda"
          description="Gera slots depois de suficientes disponibilidades estarem submetidas e o alinhamento definido."
          action={
            user.role === "ADMIN" ? (
              <form
                action={async () => {
                  "use server";
                  const rangeStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                  await generateBandSuggestions({
                    bandId,
                    rangeStart,
                    rangeEnd: addWeeks(rangeStart, 2),
                    durationMinutes: 120,
                  });
                }}
              >
                <GenerateSuggestionsButton label="Gerar sugestões" />
              </form>
            ) : null
          }
        />
      )}
    </PageContainer>
  );
}
