import type { H2HMatchRecord, H2HSummary, Match, Participant } from "@/types";

interface MatchWithContext {
  match: Pick<
    Match,
    "player1_id" | "player2_id" | "goals_p1" | "goals_p2" | "played" | "updated_at"
  >;
  tournamentName: string;
  tournamentTheme: string;
  player1Team: string;
  player2Team: string;
}

/**
 * Construye el resumen Cara a Cara (H2H) entre dos usuarios a partir de sus
 * partidos jugados. El orden de `history` es del partido más reciente al más
 * antiguo.
 */
export function buildH2HSummary(
  playerAId: string,
  playerBId: string,
  matches: MatchWithContext[],
): H2HSummary {
  const summary: H2HSummary = {
    matchesPlayed: 0,
    winsPlayerA: 0,
    winsPlayerB: 0,
    draws: 0,
    goalsPlayerA: 0,
    goalsPlayerB: 0,
    history: [],
  };

  const relevant = matches
    .filter(
      ({ match }) =>
        match.played &&
        match.goals_p1 !== null &&
        match.goals_p2 !== null &&
        ((match.player1_id === playerAId && match.player2_id === playerBId) ||
          (match.player1_id === playerBId && match.player2_id === playerAId)),
    )
    .sort(
      (a, b) =>
        new Date(b.match.updated_at).getTime() -
        new Date(a.match.updated_at).getTime(),
    );

  for (const entry of relevant) {
    const { match } = entry;
    const goalsP1 = match.goals_p1 as number;
    const goalsP2 = match.goals_p2 as number;

    const aIsHome = match.player1_id === playerAId;
    const goalsA = aIsHome ? goalsP1 : goalsP2;
    const goalsB = aIsHome ? goalsP2 : goalsP1;

    summary.matchesPlayed += 1;
    summary.goalsPlayerA += goalsA;
    summary.goalsPlayerB += goalsB;

    if (goalsA > goalsB) summary.winsPlayerA += 1;
    else if (goalsB > goalsA) summary.winsPlayerB += 1;
    else summary.draws += 1;

    const record: H2HMatchRecord = {
      tournamentName: entry.tournamentName,
      tournamentTheme: entry.tournamentTheme,
      player1Team: entry.player1Team,
      player2Team: entry.player2Team,
      goalsP1,
      goalsP2,
      date: match.updated_at,
    };

    summary.history.push(record);
  }

  return summary;
}

export function participantLabel(participant: Participant): string {
  return `${participant.username} (${participant.teamName})`;
}
