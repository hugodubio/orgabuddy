"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { SuggestionCard } from "@/components/suggestions/suggestion-card";

type Suggestion = {
  id: string;
  startAt: Date;
  endAt: Date;
  score: number;
  availableMembersCount: number;
  requiredMembersAvailable: boolean;
  metadata: unknown;
};

export function SuggestionList({
  bandId,
  suggestions,
  canConfirm,
  renderDetail,
}: {
  bandId: string;
  suggestions: Suggestion[];
  canConfirm: boolean;
  renderDetail: (suggestion: Suggestion | null) => ReactNode;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(suggestions[0]?.id ?? null);
  const selected = suggestions.find((suggestion) => suggestion.id === selectedId) ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            bandId={bandId}
            suggestion={suggestion}
            canConfirm={canConfirm}
            selected={selectedId === suggestion.id}
            onSelect={() => setSelectedId(suggestion.id)}
          />
        ))}
      </div>
      <div>{renderDetail(selected)}</div>
    </div>
  );
}
