"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deletePuskasNomination } from "@/app/api/actions/awards";
import { Button } from "@/components/ui/button";

export function DeleteNominationButton({
  nominationId,
  tournamentId,
}: {
  nominationId: string;
  tournamentId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta nominación al Puskas?")) {
      return;
    }

    startTransition(async () => {
      await deletePuskasNomination(nominationId, tournamentId);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
      disabled={isPending}
      onClick={handleDelete}
    >
      Eliminar
    </Button>
  );
}
