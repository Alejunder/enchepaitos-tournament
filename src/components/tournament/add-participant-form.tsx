"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addParticipant } from "@/app/api/actions/tournaments";
import { Input } from "@/components/ui/input";
import { SaveButton, type SaveState } from "@/components/ui/save-button";

export function AddParticipantForm({
  tournamentId,
  users,
}: {
  tournamentId: string;
  users: { id: string; username: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [state, setState] = useState<SaveState>("dirty");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("saving");

    startTransition(async () => {
      const result = await addParticipant(tournamentId, userId, teamName);

      if (!result.success) {
        setError(result.error);
        setState("dirty");
        return;
      }

      setError(null);
      setUserId("");
      setTeamName("");
      setState("saved");
      router.refresh();
    });
  }

  if (users.length === 0) {
    return (
      <p className="text-xs text-chalk/50">
        No hay usuarios aprobados pendientes de inscribir.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <select
        value={userId}
        onChange={(event) => {
          setUserId(event.target.value);
          setState("dirty");
        }}
        className="h-9 w-full rounded-lg border border-leather-stitch/50 bg-black/40 px-3 text-sm text-chalk shadow-skeuo-inset focus:border-beer focus:outline-none"
      >
        <option value="" disabled className="bg-leather-dark">
          Selecciona un usuario…
        </option>
        {users.map((user) => (
          <option key={user.id} value={user.id} className="bg-leather-dark">
            {user.username}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <Input
          value={teamName}
          onChange={(event) => {
            setTeamName(event.target.value);
            setState("dirty");
          }}
          placeholder="Equipo de FL26"
          className="h-9 text-sm"
        />
        <SaveButton
          state={isPending ? "saving" : state}
          dirtyLabel="Añadir"
          savedLabel="Añadido ✓"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
