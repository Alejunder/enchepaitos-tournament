"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { closeTournament } from "@/app/api/actions/awards";
import { Button } from "@/components/ui/button";

export function CloseTournamentButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    startTransition(async () => {
      const result = await closeTournament(tournamentId);

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
      <Button variant="danger" size="sm" disabled={isPending} onClick={close}>
        {isPending ? "Cerrando..." : "Cerrar torneo y repartir premios"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
