import { Badge } from "@/components/ui/badge";
import type { TournamentStatus } from "@/types";

const LABEL: Record<TournamentStatus, string> = {
  draft: "Borrador",
  active: "En juego",
  knockout: "Eliminatorias",
  finished: "Finalizado",
};

const TONE: Record<TournamentStatus, "neutral" | "success" | "info" | "warning"> = {
  draft: "neutral",
  active: "success",
  knockout: "warning",
  finished: "info",
};

export function TournamentStatusBadge({
  status,
}: {
  status: TournamentStatus;
}) {
  return <Badge tone={TONE[status]}>{LABEL[status]}</Badge>;
}
