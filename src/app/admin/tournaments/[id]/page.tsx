import Link from "next/link";
import { notFound } from "next/navigation";

import { CloseTournamentButton } from "@/components/media/close-tournament-button";
import { AwardsPanel } from "@/components/stats/awards-panel";
import { GoalsRanking } from "@/components/stats/goals-ranking";
import { PuskasRanking } from "@/components/stats/puskas-ranking";
import { ChalkboardPanel } from "@/components/tournament/ChalkboardPanel";
import { AddParticipantForm } from "@/components/tournament/add-participant-form";
import { DeleteTournamentButton } from "@/components/tournament/delete-tournament-button";
import { ParticipantAdminActions } from "@/components/tournament/participant-admin-actions";
import { ResultForm } from "@/components/tournament/result-form";
import { ScheduleActions } from "@/components/tournament/schedule-actions";
import { StandingsTable } from "@/components/tournament/standings-table";
import { StatusActions } from "@/components/tournament/status-actions";
import { TournamentCover } from "@/components/tournament/tournament-cover";
import { TournamentEditForm } from "@/components/tournament/tournament-edit-form";
import { TournamentStatusBadge } from "@/components/tournament/tournament-status-badge";
import { Card } from "@/components/ui/card";
import { PaperPanel } from "@/components/ui/PaperPanel";
import { refreshTournamentLifecycle } from "@/lib/lifecycle";
import { tieAggregate } from "@/lib/knockout";
import {
  getBeerDebts,
  getPuskasNominations,
  getPuskasVotes,
  getTournamentAwards,
} from "@/lib/queries/awards";
import {
  getAddableUsers,
  getJornadaProgress,
  getTournamentBundle,
} from "@/lib/queries/tournaments";
import { formatDateTime } from "@/lib/utils";
import type { Match, MatchPhase, Participant } from "@/types";

const PHASE_LABEL: Record<MatchPhase, string> = {
  group: "Grupos",
  playin: "Sub-eliminatoria (Play-in)",
  round16: "Octavos",
  quarter: "Cuartos",
  semi: "Semifinales",
  final: "Final",
};

const PHASE_ORDER: MatchPhase[] = ["playin", "round16", "quarter", "semi", "final"];

export const dynamic = "force-dynamic";

export default async function AdminTournamentDetailPage({
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
  const participantById = new Map(
    participants.map((participant) => [participant.userId, participant]),
  );

  const knockoutTies = new Map<string, Map<number, Match[]>>();
  for (const match of knockoutMatches) {
    let phaseMap = knockoutTies.get(match.phase);
    if (!phaseMap) {
      phaseMap = new Map();
      knockoutTies.set(match.phase, phaseMap);
    }
    const slot = match.bracket_slot ?? 0;
    const tie = phaseMap.get(slot) ?? [];
    tie.push(match);
    phaseMap.set(slot, tie);
  }

  const [awards, beerDebts, addableUsers, nominations, votes] =
    await Promise.all([
      getTournamentAwards(id),
      getBeerDebts(id),
      getAddableUsers(id),
      getPuskasNominations(id),
      getPuskasVotes(id),
    ]);

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
          <div>
            <Link
              href="/admin/tournaments"
              className="text-xs text-ink/70 hover:underline"
            >
              ← Torneos
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-graffiti text-2xl font-bold text-ink">
                {tournament.name}
              </h1>
              <TournamentStatusBadge status={tournament.status} />
            </div>
            <p className="text-2xl font-bold text-ink">
              📅 {formatDateTime(tournament.starts_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusActions
              tournamentId={tournament.id}
              status={tournament.status}
            />
            <Link
              href={`/torneos/${tournament.id}`}
              className="text-sm text-ink/70 hover:underline"
            >
              Ver público
            </Link>
          </div>
        </div>
      </PaperPanel>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">
            Participantes ({participants.length})
          </h2>
          {participants.length === 0 ? (
            <p className="text-sm text-chalk/50">Sin inscripciones aún.</p>
          ) : (
            <ul className="divide-y divide-leather-stitch/30">
              {participants.map((participant) => (
                <li key={participant.userId} className="py-3 text-sm">
                  <p className="mb-2 font-medium text-chalk">
                    {participant.username}
                  </p>
                  <ParticipantAdminActions
                    tournamentId={tournament.id}
                    userId={participant.userId}
                    teamName={participant.teamName}
                    teamLogoUrl={participant.teamLogoUrl}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-leather-stitch/30 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-chalk/60">
              Añadir participante
            </p>
            <AddParticipantForm
              tournamentId={tournament.id}
              users={addableUsers}
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Calendario</h2>
          <ScheduleActions
            tournamentId={tournament.id}
            hasSchedule={matches.length > 0}
            participantCount={participants.length}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Editar torneo</h2>
          <TournamentEditForm
            tournament={{
              id: tournament.id,
              theme: tournament.theme,
              entry_fee: tournament.entry_fee,
              starts_at: tournament.starts_at,
              cover_image_url: tournament.cover_image_url,
            }}
          />
          <div className="border-t border-leather-stitch/30 pt-4">
            <DeleteTournamentButton tournamentId={tournament.id} />
          </div>
        </Card>
      </section>

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
            Resultados
          </h2>
        </PaperPanel>
        {matchesByJornada.size === 0 ? (
          <PaperPanel>
            <p className="text-sm text-ink/75">
              Genera el calendario para empezar a registrar resultados.
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
            <div className="grid gap-2 sm:grid-cols-2">
              {(matchesByJornada.get(jornadaProgress.current) ?? []).map(
                (match) => (
                  <div
                    key={match.id}
                    className="rounded-lg border border-leather-stitch/60 bg-chalkboard p-3 shadow-skeuo-inset"
                  >
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-chalk">
                        {label(match.player1_id ? participantById.get(match.player1_id) : null)}
                      </span>
                      <span className="text-xs uppercase tracking-widest text-chalk/40">vs</span>
                      <span className="font-medium text-chalk">
                        {label(match.player2_id ? participantById.get(match.player2_id) : null)}
                      </span>
                    </div>
                    <ResultForm
                      matchId={match.id}
                      tournamentId={tournament.id}
                      goalsP1={match.goals_p1}
                      goalsP2={match.goals_p2}
                    />
                  </div>
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
                      <div
                        key={match.id}
                        className="rounded-lg border border-leather-stitch/60 bg-chalkboard p-3 shadow-skeuo-inset"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-chalk">
                            {label(match.player1_id ? participantById.get(match.player1_id) : null)}
                          </span>
                          <span className="font-bold text-beer tabular-nums">
                            {match.goals_p1 ?? "-"} - {match.goals_p2 ?? "-"}
                          </span>
                          <span className="font-medium text-chalk">
                            {label(match.player2_id ? participantById.get(match.player2_id) : null)}
                          </span>
                        </div>
                      </div>
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
          {PHASE_ORDER.map((phase) => {
            const phaseMap = knockoutTies.get(phase);
            if (!phaseMap || phaseMap.size === 0) {
              return null;
            }

            const ties = [...phaseMap.entries()].sort((a, b) => a[0] - b[0]);

            return (
              <div key={phase} className="space-y-2">
                <PaperPanel className="inline-block px-3 py-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">
                    {PHASE_LABEL[phase]}
                  </h3>
                </PaperPanel>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ties.map(([slot, tie]) => {
                    const sorted = [...tie].sort((a, b) => (a.leg ?? 0) - (b.leg ?? 0));
                    const first = sorted[0];
                    const level = tieIsLevel(sorted);

                    return (
                      <div
                        key={slot}
                        className="rounded-lg border border-leather-stitch/60 bg-chalkboard p-3 shadow-skeuo-inset"
                      >
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-chalk">
                            {label(first.player1_id ? participantById.get(first.player1_id) : null)}
                          </span>
                          <span className="text-xs uppercase tracking-widest text-chalk/40">vs</span>
                          <span className="font-medium text-chalk">
                            {label(first.player2_id ? participantById.get(first.player2_id) : null)}
                          </span>
                        </div>
                        {sorted.length === 1 && (
                          <ResultForm
                            matchId={first.id}
                            tournamentId={tournament.id}
                            goalsP1={first.goals_p1}
                            goalsP2={first.goals_p2}
                            penaltiesP1={first.penalties_p1}
                            penaltiesP2={first.penalties_p2}
                            withPenalties={level}
                          />
                        )}
                        {sorted.length > 1 && (
                          <div className="space-y-3">
                            {sorted.map((match) => (
                              <div key={match.id} className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-chalk/50">
                                  {match.leg === 1 ? "Ida" : "Vuelta"}
                                </p>
                                <p className="text-xs text-chalk/60">
                                  {label(match.player1_id ? participantById.get(match.player1_id) : null)}{" "}
                                  (local) vs{" "}
                                  {label(match.player2_id ? participantById.get(match.player2_id) : null)}
                                </p>
                                <ResultForm
                                  matchId={match.id}
                                  tournamentId={tournament.id}
                                  goalsP1={match.goals_p1}
                                  goalsP2={match.goals_p2}
                                  penaltiesP1={match.penalties_p1}
                                  penaltiesP2={match.penalties_p2}
                                  withPenalties={match.leg === 2 && level}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="space-y-3">
        <PaperPanel className="inline-block px-4 py-2">
          <h2 className="text-graffiti text-lg font-bold text-ink">
            🥊 Ranking Puskas
          </h2>
        </PaperPanel>
        <ChalkboardPanel title="Ranking Puskas · Votaciones">
          <PuskasRanking nominations={nominations} votes={votes} />
        </ChalkboardPanel>
      </section>

      <section className="space-y-3">
        <PaperPanel className="inline-block px-4 py-2">
          <h2 className="text-graffiti text-lg font-bold text-ink">
            🏆 Premios y cierre
          </h2>
        </PaperPanel>
        <Card className="space-y-4">
          {tournament.status !== "finished" && (
            <CloseTournamentButton tournamentId={tournament.id} />
          )}
          <AwardsPanel
            awards={awards}
            beerDebts={beerDebts}
            participants={participants}
            finished={tournament.status === "finished"}
          />
        </Card>
      </section>
    </div>
  );
}

function label(participant: Participant | null | undefined): string {
  return participant
    ? `${participant.username} (${participant.teamName})`
    : "—";
}

function tieIsLevel(tie: Match[]): boolean {
  if (!tie.every((match) => match.played)) {
    return false;
  }

  const { aggA, aggB } = tieAggregate(tie);

  return aggA === aggB;
}
