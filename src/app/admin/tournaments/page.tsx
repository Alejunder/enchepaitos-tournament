import Link from "next/link";

import { TournamentForm } from "@/components/tournament/tournament-form";
import { TournamentStatusBadge } from "@/components/tournament/tournament-status-badge";
import { Card } from "@/components/ui/card";
import { PaperPanel } from "@/components/ui/PaperPanel";
import { listTournaments } from "@/lib/queries/tournaments";
import { formatDate, formatEuro } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const tournaments = await listTournaments();

  return (
    <div className="space-y-8">
      <PaperPanel>
        <h1 className="text-graffiti text-2xl font-bold text-ink">Torneos</h1>
        <p className="mt-1 text-sm text-ink/75">
          Crea torneos, gestiona inscripciones y calendarios.
        </p>
      </PaperPanel>

      <Card>
        <h2 className="mb-4 font-semibold text-chalk">Nuevo torneo</h2>
        <TournamentForm />
      </Card>

      <section className="space-y-3">
        <PaperPanel className="inline-block px-4 py-2">
          <h2 className="text-graffiti text-lg font-bold text-ink">
            Existentes
          </h2>
        </PaperPanel>
        {tournaments.length === 0 ? (
          <PaperPanel>
            <p className="text-sm text-ink/75">Todavía no hay torneos.</p>
          </PaperPanel>
        ) : (
          <Card className="divide-y divide-leather-stitch/30 p-0">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/admin/tournaments/${tournament.id}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-white/5"
              >
                <div>
                  <p className="font-medium text-chalk">{tournament.name}</p>
                  <p className="text-xs text-chalk/60">{tournament.theme}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-chalk/50">
                  <span>{tournament.participantCount} jugadores</span>
                  <span>{formatEuro(tournament.entry_fee)}</span>
                  <span>{formatDate(tournament.created_at)}</span>
                  <TournamentStatusBadge status={tournament.status} />
                </div>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
