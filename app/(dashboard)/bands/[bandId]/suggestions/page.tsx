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
        eyebrow="Suggestions"
        title={`${band.name} ranked slots`}
        description="These are the best valid windows based on current availability, member importance, and confirmed-rehearsal conflicts."
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
              <GenerateSuggestionsButton />
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
          title="No valid suggestions yet"
          description="Generate ranked slots after enough availability has been submitted and the required lineup is defined."
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
                <GenerateSuggestionsButton label="Generate suggestions" />
              </form>
            ) : null
          }
        />
      )}
    </PageContainer>
  );
}
