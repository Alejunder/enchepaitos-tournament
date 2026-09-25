"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { createPuskasNomination } from "@/app/api/actions/awards";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_VIDEO_SIZE_BYTES,
  PUSKAS_BUCKET,
  uploadPuskasVideo,
} from "@/lib/supabase/storage";

export interface NominationMatchOption {
  id: string;
  label: string;
}

export function PuskasNominationForm({
  tournamentId,
  matches,
}: {
  tournamentId: string;
  matches: NominationMatchOption[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [matchId, setMatchId] = useState(matches[0]?.id ?? "");
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setError("El vídeo supera el límite de 50 MB.");
      return;
    }

    if (!matchId) {
      setError("Selecciona el partido al que corresponde el gol.");
      return;
    }

    setUploading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("No estás autenticado.");
      setUploading(false);
      return;
    }

    const result = await uploadPuskasVideo(supabase, file, {
      tournamentId,
      matchId,
      userId: user.id,
    });

    if ("error" in result) {
      setError("No se pudo subir el vídeo. Comprueba el formato.");
      setUploading(false);
      return;
    }

    const url = supabase.storage
      .from(PUSKAS_BUCKET)
      .getPublicUrl(result.path).data.publicUrl;

    startTransition(async () => {
      const response = await createPuskasNomination(tournamentId, matchId, url);

      if (!response.success) {
        setError(response.error);
      } else if (fileRef.current) {
        fileRef.current.value = "";
        router.refresh();
      }

      setUploading(false);
    });
  }

  if (matches.length === 0) {
    return (
      <p className="text-sm text-chalk/50">
        No tienes partidos jugados para nominar un gol.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <select
        value={matchId}
        onChange={(event) => setMatchId(event.target.value)}
        className="h-10 w-full rounded-lg border border-leather-stitch/50 bg-black/40 px-3 text-sm text-chalk shadow-skeuo-inset focus:border-beer focus:outline-none focus:ring-2 focus:ring-beer/30"
      >
        {matches.map((match) => (
          <option key={match.id} value={match.id} className="bg-leather-dark">
            {match.label}
          </option>
        ))}
      </select>

      <label className="inline-flex cursor-pointer items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading || isPending}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Subiendo..." : "Subir vídeo desde la galería"}
        </Button>
      </label>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
