"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteTournament } from "@/app/api/actions/tournaments";
import { Button } from "@/components/ui/button";

export function DeleteTournamentButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (
      !window.confirm(
        "¿Eliminar este torneo? Se borrarán inscripciones, partidos, premios y votos.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteTournament(tournamentId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/admin/tournaments");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        variant="danger"
        size="sm"
        disabled={isPending}
        onClick={handleDelete}
      >
        {isPending ? "Eliminando..." : "Eliminar torneo"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
