"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { votePuskas } from "@/app/api/actions/awards";
import { Button } from "@/components/ui/button";

export function PuskasVoteButton({
  nominationId,
  tournamentId,
  votes,
  alreadyVoted,
  canVote,
}: {
  nominationId: string;
  tournamentId: string;
  votes: number;
  alreadyVoted: boolean;
  canVote: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function vote() {
    startTransition(async () => {
      const result = await votePuskas(nominationId, tournamentId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setError(null);
      router.refresh();
    });
  }

  if (alreadyVoted) {
    return (
      <span className="text-xs font-medium text-led-text">
        ✓ Votado · {votes} {votes === 1 ? "voto" : "votos"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={!canVote || isPending}
        onClick={vote}
        title={canVote ? "Votar" : "Solo jugadores aprobados pueden votar"}
      >
        {isPending ? "..." : `Votar (${votes})`}
      </Button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
