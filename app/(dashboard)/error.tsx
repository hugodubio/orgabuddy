"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-2xl font-semibold">Something went wrong</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred. Try refreshing or going back."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
