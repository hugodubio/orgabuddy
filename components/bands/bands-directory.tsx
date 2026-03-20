"use client";

import { useMemo, useState } from "react";
import { BandCard } from "@/components/bands/band-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";

type DirectoryBand = {
  id: string;
  name: string;
  description: string | null;
  members: Array<{ isRequired: boolean }>;
  rehearsals: Array<{ startAt: Date }>;
};

export function BandsDirectory({ bands }: { bands: DirectoryBand[] }) {
  const [query, setQuery] = useState("");

  const filteredBands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return bands;
    }

    return bands.filter((band) => {
      const haystack = [band.name, band.description ?? ""].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [bands, query]);

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Pesquisar bandas..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {filteredBands.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredBands.map((band) => (
            <BandCard key={band.id} band={band} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma banda encontrada"
          description="Tenta outro nome ou limpa a pesquisa para ver todas as bandas."
        />
      )}
    </div>
  );
}
