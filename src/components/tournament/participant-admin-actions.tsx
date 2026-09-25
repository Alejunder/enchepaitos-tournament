"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  removeParticipant,
  updateParticipantTeam,
} from "@/app/api/actions/tournaments";
import {
  TeamPicker,
  type TeamSelection,
} from "@/components/tournament/team-picker";
import { Button } from "@/components/ui/button";

export function ParticipantAdminActions({
  tournamentId,
  userId,
  teamName,
  teamLogoUrl,
}: {
  tournamentId: string;
  userId: string;
  teamName: string;
  teamLogoUrl: string | null | undefined;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [team, setTeam] = useState<TeamSelection>({
    name: teamName,
    logoUrl: teamLogoUrl ?? null,
    providerId: null,
  });
  const [error, setError] = useState<string | null>(null);

  function saveTeam() {
    startTransition(async () => {
      const result = await updateParticipantTeam(
        tournamentId,
        userId,
        team.name,
        team.logoUrl,
        team.providerId,
      );

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
      <div className="w-44">
        <TeamPicker
          initialName={teamName}
          initialLogo={teamLogoUrl ?? null}
          inputClassName="h-8 text-xs"
          onChange={setTeam}
        />
      </div>
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
