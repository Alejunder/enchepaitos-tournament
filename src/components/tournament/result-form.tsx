"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  clearMatchResult,
  updateMatchResult,
} from "@/app/api/actions/tournaments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaveButton, type SaveState } from "@/components/ui/save-button";

export function ResultForm({
  matchId,
  tournamentId,
  goalsP1,
  goalsP2,
  penaltiesP1,
  penaltiesP2,
  withPenalties = false,
}: {
  matchId: string;
  tournamentId: string;
  goalsP1: number | null;
  goalsP2: number | null;
  penaltiesP1?: number | null;
  penaltiesP2?: number | null;
  withPenalties?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<SaveState>(
    goalsP1 !== null || goalsP2 !== null ? "saved" : "dirty",
  );
  const [error, setError] = useState<string | null>(null);

  function markDirty() {
    setState("dirty");
  }

  function save(formData: FormData) {
    const home = Number(formData.get("goalsP1"));
    const away = Number(formData.get("goalsP2"));

    let pen1: number | null = null;
    let pen2: number | null = null;
    if (withPenalties) {
      const pen1Raw = String(formData.get("penaltiesP1") ?? "").trim();
      const pen2Raw = String(formData.get("penaltiesP2") ?? "").trim();
      pen1 = pen1Raw === "" ? null : Number(pen1Raw);
      pen2 = pen2Raw === "" ? null : Number(pen2Raw);
    }

    setState("saving");

    startTransition(async () => {
      const result = await updateMatchResult(
        matchId,
        tournamentId,
        home,
        away,
        pen1,
        pen2,
      );

      if (!result.success) {
        setError(result.error);
        setState("dirty");
        return;
      }

      setError(null);
      setState("saved");
      router.refresh();
    });
  }

  function clear() {
    setState("saving");
    startTransition(async () => {
      await clearMatchResult(matchId, tournamentId);
      setState("saved");
      router.refresh();
    });
  }

  const hasResult = goalsP1 !== null || goalsP2 !== null;

  return (
    <form action={save} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          name="goalsP1"
          type="number"
          min={0}
          max={99}
          defaultValue={goalsP1 ?? ""}
          onChange={markDirty}
          className="w-16"
          aria-label="Goles local"
          required
        />
        <span className="text-xs text-chalk/40">-</span>
        <Input
          name="goalsP2"
          type="number"
          min={0}
          max={99}
          defaultValue={goalsP2 ?? ""}
          onChange={markDirty}
          className="w-16"
          aria-label="Goles visitante"
          required
        />

        {!withPenalties && (
          <SaveButton state={isPending ? "saving" : state} />
        )}

        {hasResult && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={clear}
          >
            Limpiar
          </Button>
        )}
      </div>

      {withPenalties && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-beer">Penaltis</span>
          <Input
            name="penaltiesP1"
            type="number"
            min={0}
            max={99}
            defaultValue={penaltiesP1 ?? ""}
            onChange={markDirty}
            className="w-16"
            aria-label="Penaltis local"
          />
          <span className="text-xs text-chalk/40">-</span>
          <Input
            name="penaltiesP2"
            type="number"
            min={0}
            max={99}
            defaultValue={penaltiesP2 ?? ""}
            onChange={markDirty}
            className="w-16"
            aria-label="Penaltis visitante"
          />
          <SaveButton state={isPending ? "saving" : state} />
        </div>
      )}

      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
