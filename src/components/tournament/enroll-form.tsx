"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { enrollInTournament } from "@/app/api/actions/tournaments";
import { Input } from "@/components/ui/input";
import { SaveButton, type SaveState } from "@/components/ui/save-button";

export function EnrollForm({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<SaveState>("dirty");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const teamName = String(formData.get("teamName") ?? "");
    setState("saving");

    startTransition(async () => {
      const result = await enrollInTournament(tournamentId, teamName);

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

  return (
    <form action={handleSubmit} className="flex flex-wrap items-start gap-3">
      <Input
        name="teamName"
        placeholder="Tu equipo de FL26 (obligatorio)"
        required
        minLength={2}
        maxLength={40}
        className="max-w-xs"
        onChange={() => setState("dirty")}
      />
      <SaveButton
        state={isPending ? "saving" : state}
        dirtyLabel="Inscribirme"
        savedLabel="Inscrito ✓"
      />
      {error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
