import Link from "next/link";

import { TournamentStatusBadge } from "@/components/tournament/tournament-status-badge";
import { TournamentCover } from "@/components/tournament/tournament-cover";
import { Card } from "@/components/ui/card";
import { PaperPanel } from "@/components/ui/PaperPanel";
import { listTournaments } from "@/lib/queries/tournaments";
import { formatDateTime, formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const tournaments = await listTournaments();

  return (
    <div className="space-y-6">
      <PaperPanel>
        <h1 className="text-graffiti text-2xl font-bold text-ink">Torneos</h1>
        <p className="mt-1 text-sm text-ink/75">
          Historial de competiciones de Enchepaitos Tournament.
        </p>
      </PaperPanel>

      {tournaments.length === 0 ? (
        <PaperPanel>
          <p className="text-sm text-ink/75">Todavía no hay torneos.</p>
        </PaperPanel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map((tournament) => (
            <Link key={tournament.id} href={`/torneos/${tournament.id}`}>
              <Card className="h-full space-y-4 transition-colors hover:border-beer/70">
                <TournamentCover
                  src={tournament.cover_image_url}
                  alt={tournament.theme}
                  className="aspect-[16/6] w-full rounded-lg"
                />
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-chalk">
                    {tournament.name}
                  </h2>
                  <TournamentStatusBadge status={tournament.status} />
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-chalk/50">
                  <span>{tournament.participantCount} participantes</span>
                  <span>Cuota {formatEuro(tournament.entry_fee)}</span>
                  <span>📅 {formatDateTime(tournament.starts_at)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
