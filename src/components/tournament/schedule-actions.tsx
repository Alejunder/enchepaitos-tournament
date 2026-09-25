"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deleteSchedule,
  generateSchedule,
} from "@/app/api/actions/tournaments";
import { Button } from "@/components/ui/button";

export function ScheduleActions({
  tournamentId,
  hasSchedule,
  participantCount,
}: {
  tournamentId: string;
  hasSchedule: boolean;
  participantCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: "generate" | "delete") {
    startTransition(async () => {
      const result =
        action === "generate"
          ? await generateSchedule(tournamentId)
          : await deleteSchedule(tournamentId);

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
        {hasSchedule ? (
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => run("delete")}
          >
            Eliminar calendario
          </Button>
        ) : (
          <Button
            disabled={isPending || participantCount < 2}
            onClick={() => run("generate")}
          >
            {isPending ? "Generando..." : "Generar calendario"}
          </Button>
        )}
      </div>
      {!hasSchedule && participantCount < 2 && (
        <p className="text-xs text-chalk/50">
          Se necesitan al menos 2 participantes.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
