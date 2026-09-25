import { notFound } from "next/navigation";

import {
  PuskasGallery,
} from "@/components/media/puskas-gallery";
import {
  PuskasNominationForm,
  type NominationMatchOption,
} from "@/components/media/puskas-nomination-form";
import { AwardsPanel } from "@/components/stats/awards-panel";
import { GoalsRanking } from "@/components/stats/goals-ranking";
import { PuskasRanking } from "@/components/stats/puskas-ranking";
import { ShareCard } from "@/components/stats/share-card";
import { ShareCardButton } from "@/components/stats/share-card-button";
import { ChalkboardPanel } from "@/components/tournament/ChalkboardPanel";
import { EnrollForm } from "@/components/tournament/enroll-form";
import { KnockoutBracket } from "@/components/tournament/knockout-bracket";
import { MatchCard } from "@/components/tournament/match-card";
import { StandingsTable } from "@/components/tournament/standings-table";
import { TournamentStatusBadge } from "@/components/tournament/tournament-status-badge";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeatherCard } from "@/components/ui/LeatherCard";
import { PaperPanel } from "@/components/ui/PaperPanel";
import { getCurrentProfile } from "@/lib/auth";
import { refreshTournamentLifecycle } from "@/lib/lifecycle";
import {
  getBeerDebts,
  getPuskasNominations,
  getPuskasVotes,
  getTournamentAwards,
} from "@/lib/queries/awards";
import {
  getJornadaProgress,
  getTournamentBundle,
  isParticipant,
} from "@/lib/queries/tournaments";
import { formatDateTime, formatEuro } from "@/lib/utils";
import { TournamentCover } from "@/components/tournament/tournament-cover";
import type { Match, Participant } from "@/types";

export const dynamic = "force-dynamic";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await refreshTournamentLifecycle(id);
  const bundle = await getTournamentBundle(id);

  if (!bundle) {
    notFound();
  }

  const { tournament, participants, matches, knockoutMatches, standings } =
    bundle;
  const profile = await getCurrentProfile();
  const enrolled = isParticipant(participants, profile?.id);
  const participantById = new Map(
    participants.map((participant) => [participant.userId, participant]),
  );

  const [awards, nominations, votes, beerDebts] = await Promise.all([
    getTournamentAwards(id),
    getPuskasNominations(id),
    getPuskasVotes(id),
    getBeerDebts(id),
  ]);

  const isFinished = tournament.status === "finished";
  const isApproved = profile?.status === "approved";
  const canVote = isApproved && !isFinished;

  const nominationMatches: NominationMatchOption[] = isApproved
    ? matches
        .filter(
          (match) =>
            match.played &&
            (match.player1_id === profile?.id ||
              match.player2_id === profile?.id),
        )
        .map((match) => ({
          id: match.id,
          label: `J${match.jornada}: ${labelOf(match.player1_id ? participantById.get(match.player1_id) : null)} vs ${labelOf(match.player2_id ? participantById.get(match.player2_id) : null)}`,
        }))
    : [];

  const matchesByJornada = new Map<number, Match[]>();
  for (const match of matches) {
    const list = matchesByJornada.get(match.jornada) ?? [];
    list.push(match);
    matchesByJornada.set(match.jornada, list);
  }
  const jornadaProgress = getJornadaProgress(matches);

  return (
    <div className="space-y-8">
      <PaperPanel className="space-y-3">
        <TournamentCover
          src={tournament.cover_image_url}
          alt={tournament.theme}
          className="aspect-[16/6] w-full rounded-lg"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-graffiti text-3xl font-bold text-ink">
            {tournament.name}
          </h1>
          <TournamentStatusBadge status={tournament.status} />
        </div>
        <p className="text-2xl font-bold text-ink">
          📅 {formatDateTime(tournament.starts_at)}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-ink/75">
          <span>{participants.length} participantes</span>
          <span>Cuota {formatEuro(tournament.entry_fee)}</span>
        </div>
      </PaperPanel>

      <LeatherCard>
        <h2 className="mb-3 font-semibold text-chalk">Inscripción</h2>
        {isFinished ? (
          <p className="text-sm text-chalk/50">Torneo finalizado.</p>
        ) : tournament.status !== "draft" ? (
          <p className="text-sm text-chalk/50">Las inscripciones están cerradas.</p>
        ) : new Date(tournament.starts_at).getTime() <= Date.now() ? (
          <p className="text-sm text-chalk/50">
            El plazo de inscripción ha finalizado.
          </p>
        ) : !profile ? (
          <LinkButton href="/login" variant="secondary" size="sm">
            Inicia sesión para inscribirte
          </LinkButton>
        ) : profile.status !== "approved" ? (
          <p className="text-sm text-beer">
            Tu cuenta está pendiente de validación por el Admin.
          </p>
        ) : enrolled ? (
          <p className="text-sm text-led-text">
            Ya estás inscrito con{" "}
            {participants.find((p) => p.userId === profile.id)?.teamName}.
          </p>
        ) : (
          <EnrollForm tournamentId={tournament.id} />
        )}
      </LeatherCard>

      <section className="space-y-3">
        <PaperPanel className="inline-block px-4 py-2">
          <h2 className="text-graffiti text-lg font-bold text-ink">
            Clasificación
          </h2>
        </PaperPanel>
        <ChalkboardPanel title="Clasificación">
          <StandingsTable standings={standings} />
        </ChalkboardPanel>
      </section>

      <section className="space-y-3">
        <PaperPanel className="inline-block px-4 py-2">
          <h2 className="text-graffiti text-lg font-bold text-ink">
            Estadísticas
          </h2>
        </PaperPanel>
        <div className="grid gap-3 lg:grid-cols-2">
          <ChalkboardPanel title="Bota de Oro · Goleadores">
            <GoalsRanking standings={standings} metric="goalsFor" />
          </ChalkboardPanel>
          <ChalkboardPanel title="Al que más se la meten · Más goleados">
            <GoalsRanking standings={standings} metric="goalsAgainst" />
          </ChalkboardPanel>
        </div>
      </section>

      <section className="space-y-4">
        <PaperPanel className="inline-block px-4 py-2">
          <h2 className="text-graffiti text-lg font-bold text-ink">
            Calendario
          </h2>
        </PaperPanel>
        {matchesByJornada.size === 0 ? (
          <PaperPanel>
            <p className="text-sm text-ink/75">
              El calendario aún no ha sido generado.
            </p>
          </PaperPanel>
        ) : jornadaProgress.current === null ? (
          <PaperPanel>
            <p className="text-sm text-ink/75">
              Todas las jornadas están jugadas.
            </p>
          </PaperPanel>
        ) : (
          <>
            <PaperPanel className="inline-block px-3 py-1">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
                Jornada {jornadaProgress.current} de {jornadaProgress.total}
              </h3>
            </PaperPanel>
            <div className="grid gap-3 sm:grid-cols-2">
              {(matchesByJornada.get(jornadaProgress.current) ?? []).map(
                (match) => (
                  <MatchCard
                    key={match.id}
                    big
                    home={resolveParticipant(participantById, match.player1_id)}
                    away={resolveParticipant(participantById, match.player2_id)}
                    goalsP1={match.goals_p1}
                    goalsP2={match.goals_p2}
                  />
                ),
              )}
            </div>

            {jornadaProgress.played.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/70">
                  Jornadas jugadas
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {jornadaProgress.played.map((jornada) =>
                    (matchesByJornada.get(jornada) ?? []).map((match) => (
                      <MatchCard
                        key={match.id}
                        home={resolveParticipant(participantById, match.player1_id)}
                        away={resolveParticipant(participantById, match.player2_id)}
                        goalsP1={match.goals_p1}
                        goalsP2={match.goals_p2}
                      />
                    )),
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {knockoutMatches.length > 0 && (
        <section className="space-y-4">
          <PaperPanel className="inline-block px-4 py-2">
            <h2 className="text-graffiti text-lg font-bold text-ink">
              🏆 Eliminatorias
            </h2>
          </PaperPanel>
          <KnockoutBracket
            matches={knockoutMatches}
            participants={participants}
          />
        </section>
      )}

      <section className="space-y-3">
        <PaperPanel className="inline-block px-4 py-2">
          <h2 className="text-graffiti text-lg font-bold text-ink">
            🏆 Premios
          </h2>
        </PaperPanel>
        <Card>
          <AwardsPanel
            awards={awards}
            beerDebts={beerDebts}
            participants={participants}
            finished={isFinished}
          />
        </Card>
      </section>

      {isFinished && awards.length > 0 && (
        <section className="space-y-3">
          <PaperPanel className="inline-block px-4 py-2">
            <h2 className="text-graffiti text-lg font-bold text-ink">
              📲 Resumen para compartir
            </h2>
          </PaperPanel>
          <div className="flex flex-col items-start gap-4">
            <ShareCard
              tournament={tournament}
              awards={awards}
              beerDebts={beerDebts}
              participants={participants}
            />
            <ShareCardButton elementId="share-card" />
          </div>
        </section>
      )}

      <section className="space-y-4">
        <PaperPanel className="inline-block px-4 py-2">
          <h2 className="text-graffiti text-lg font-bold text-ink">
            🥊 Premio Puskas
          </h2>
        </PaperPanel>

        {isApproved && !isFinished && (
          <Card>
            <h3 className="mb-3 font-semibold text-chalk">Nominar mi gol</h3>
            <PuskasNominationForm
              tournamentId={tournament.id}
              matches={nominationMatches}
            />
          </Card>
        )}

        <ChalkboardPanel title="Ranking Puskas · Votaciones">
          <PuskasRanking nominations={nominations} votes={votes} />
        </ChalkboardPanel>

        <PuskasGallery
          nominations={nominations}
          votes={votes}
          currentUserId={profile?.id}
          canVote={canVote}
          isAdmin={profile?.role === "admin"}
        />
      </section>
    </div>
  );
}

function resolveParticipant(
  map: Map<string, Participant>,
  userId: string | null,
): Participant | null {
  return userId ? map.get(userId) ?? null : null;
}

function labelOf(participant: Participant | null | undefined): string {
  return participant
    ? `${participant.username} (${participant.teamName})`
    : "—";
}
