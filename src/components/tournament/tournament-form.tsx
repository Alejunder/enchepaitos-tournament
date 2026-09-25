"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { createTournament } from "@/app/api/actions/tournaments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { uploadCoverImage } from "@/lib/supabase/storage";

export function TournamentForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [coverName, setCoverName] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const theme = String(formData.get("theme") ?? "");
    const startsAtLocal = String(formData.get("startsAt") ?? "");
    const entryFee = Number(formData.get("entryFee") ?? 5);
    const file = fileRef.current?.files?.[0] ?? null;

    startTransition(async () => {
      let coverImageUrl: string | null = null;

      if (file) {
        const supabase = createClient();
        const result = await uploadCoverImage(supabase, file);

        if ("error" in result) {
          setError("No se pudo subir la portada.");
          return;
        }

        coverImageUrl = result.url;
      }

      const startsAt = new Date(startsAtLocal).toISOString();
      const response = await createTournament({
        theme,
        startsAt,
        entryFee,
        coverImageUrl,
      });

      if (!response.success) {
        setError(response.error);
        return;
      }

      setError(null);
      router.push(`/admin/tournaments/${response.data.id}`);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <Input
        name="theme"
        placeholder="Temática (ej. Selecciones Clásicas 90s)"
        required
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-chalk/60">
          Fecha y hora del torneo
          <Input
            name="startsAt"
            type="datetime-local"
            required
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
            defaultValue={5}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) =>
            setCoverName(event.target.files?.[0]?.name ?? null)
          }
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          Adjuntar portada
        </Button>
        {coverName && (
          <span className="text-xs text-chalk/60">{coverName}</span>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creando..." : "Crear torneo"}
      </Button>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
