"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { updateTournament } from "@/app/api/actions/tournaments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { createClient } from "@/lib/supabase/client";
import { uploadCoverImage } from "@/lib/supabase/storage";
import { toLocalInputValue } from "@/lib/utils";

export function TournamentEditForm({
  tournament,
}: {
  tournament: {
    id: string;
    theme: string;
    entry_fee: number;
    starts_at: string;
    cover_image_url: string | null;
  };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<SaveState>("saved");
  const [error, setError] = useState<string | null>(null);
  const [coverName, setCoverName] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const theme = String(formData.get("theme") ?? "");
    const startsAtLocal = String(formData.get("startsAt") ?? "");
    const entryFee = Number(formData.get("entryFee") ?? tournament.entry_fee);
    const file = fileRef.current?.files?.[0] ?? null;

    setState("saving");

    startTransition(async () => {
      let coverImageUrl = tournament.cover_image_url;

      if (file) {
        const supabase = createClient();
        const result = await uploadCoverImage(supabase, file);

        if ("error" in result) {
          setError("No se pudo subir la portada.");
          setState("dirty");
          return;
        }

        coverImageUrl = result.url;
      }

      const startsAt = new Date(startsAtLocal).toISOString();
      const response = await updateTournament(tournament.id, {
        theme,
        startsAt,
        entryFee,
        coverImageUrl,
      });

      if (!response.success) {
        setError(response.error);
        setState("dirty");
        return;
      }

      setError(null);
      setState("saved");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <Input
        name="theme"
        defaultValue={tournament.theme}
        onChange={() => setState("dirty")}
        required
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-chalk/60">
          Fecha y hora del torneo
          <Input
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={toLocalInputValue(tournament.starts_at)}
            onChange={() => setState("dirty")}
            className="[color-scheme:dark]"
          />
        </label>
        <label className="space-y-1 text-xs text-chalk/60">
          Cuota de entrada (€)
          <Input
            name="entryFee"
            type="number"
            min={0}
            step="0.5"
            defaultValue={tournament.entry_fee}
            onChange={() => setState("dirty")}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            setCoverName(event.target.files?.[0]?.name ?? null);
            setState("dirty");
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          Cambiar portada
        </Button>
        {coverName && (
          <span className="text-xs text-chalk/60">{coverName}</span>
        )}
      </div>

      <SaveButton state={isPending ? "saving" : state} />

      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
