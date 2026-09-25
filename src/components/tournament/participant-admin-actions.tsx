"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  removeParticipant,
  updateParticipantTeam,
} from "@/app/api/actions/tournaments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ParticipantAdminActions({
  tournamentId,
  userId,
  teamName,
}: {
  tournamentId: string;
  userId: string;
  teamName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [team, setTeam] = useState(teamName);
  const [error, setError] = useState<string | null>(null);

  function saveTeam() {
    startTransition(async () => {
      const result = await updateParticipantTeam(tournamentId, userId, team);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setError(null);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("¿Eliminar a este participante del torneo?")) {
      return;
    }

    startTransition(async () => {
      const result = await removeParticipant(tournamentId, userId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={team}
        onChange={(event) => setTeam(event.target.value)}
        className="h-8 w-40 text-xs"
        aria-label="Nombre del equipo"
      />
      <Button size="sm" disabled={isPending} onClick={saveTeam}>
        Guardar
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={isPending}
        onClick={remove}
      >
        Quitar
      </Button>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </div>
  );
}
