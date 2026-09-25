"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setTournamentStatus } from "@/app/api/actions/tournaments";
import { Button } from "@/components/ui/button";
import type { TournamentStatus } from "@/types";

const NEXT: Record<
  TournamentStatus,
  { label: string; status: TournamentStatus; variant: "primary" | "secondary" }[]
> = {
  draft: [
    { label: "Activar", status: "active", variant: "primary" },
  ],
  active: [],
  knockout: [
    { label: "Volver a grupos", status: "active", variant: "secondary" },
  ],
  finished: [
    { label: "Reabrir", status: "active", variant: "secondary" },
  ],
};

export function StatusActions({
  tournamentId,
  status,
}: {
  tournamentId: string;
  status: TournamentStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(next: TournamentStatus) {
    startTransition(async () => {
      const result = await setTournamentStatus(tournamentId, next);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {NEXT[status].map((option) => (
          <Button
            key={option.status}
            variant={option.variant}
            size="sm"
            disabled={isPending}
            onClick={() => update(option.status)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
