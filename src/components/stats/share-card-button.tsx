"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { shareCardToWhatsApp } from "@/lib/share";

export function ShareCardButton({ elementId }: { elementId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setBusy(true);
    setError(null);

    try {
      await shareCardToWhatsApp(elementId);
    } catch {
      setError("No se pudo generar la imagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button size="sm" disabled={busy} onClick={share}>
        {busy ? "Generando..." : "Compartir por WhatsApp"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
