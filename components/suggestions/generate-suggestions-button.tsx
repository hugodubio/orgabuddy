"use client";

import { useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerateSuggestionsButton({ label = "Generate top 5" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Sparkles className="mr-2 h-4 w-4" />
      {pending ? "A gerar…" : label}
    </Button>
  );
}
