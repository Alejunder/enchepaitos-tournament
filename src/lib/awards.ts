import type { Participant } from "@/types";

export const AWARD_CODES = {
  CHAMPION: "champion",
  BOTA_DE_ORO: "bota_de_oro",
  SACO_DE_GOLES: "saco_de_goles",
  PUSKAS: "puskas",
} as const;

export interface PlayedMatchForAwards {
  player1_id: string | null;
  player2_id: string | null;
  goals_p1: number | null;
  goals_p2: number | null;
  played: boolean;
}

export interface ComputedStatAwards {
  botaDeOro: string | null;
  sacoDeGoles: string | null;
}

export interface PuskasVoteCount {
  nominationId: string;
  userId: string;
  votes: number;
}

/**
 * Deriva los premios basados en estadísticas a partir de los partidos jugados.
 * - Bota de Oro: mayor número de goles a favor (GF).
 * - Saco de Goles: mayor número de goles recibidos (GC).
 */
export function computeStatAwards(
  participants: Participant[],
  matches: PlayedMatchForAwards[],
): ComputedStatAwards {
  const goalsFor = new Map<string, number>();
  const goalsAgainst = new Map<string, number>();

  for (const participant of participants) {
    goalsFor.set(participant.userId, 0);
    goalsAgainst.set(participant.userId, 0);
  }

  for (const match of matches) {
    if (
      !match.played ||
      match.goals_p1 === null ||
      match.goals_p2 === null ||
      !match.player1_id ||
      !match.player2_id
    ) {
      continue;
    }

    goalsFor.set(
      match.player1_id,
      (goalsFor.get(match.player1_id) ?? 0) + match.goals_p1,
    );
    goalsAgainst.set(
      match.player1_id,
      (goalsAgainst.get(match.player1_id) ?? 0) + match.goals_p2,
    );
    goalsFor.set(
      match.player2_id,
      (goalsFor.get(match.player2_id) ?? 0) + match.goals_p2,
    );
    goalsAgainst.set(
      match.player2_id,
      (goalsAgainst.get(match.player2_id) ?? 0) + match.goals_p1,
    );
  }

  return {
    botaDeOro: topUserId(goalsFor),
    sacoDeGoles: topUserId(goalsAgainst),
  };
}

function topUserId(totals: Map<string, number>): string | null {
  let winner: string | null = null;
  let best = -Infinity;

  for (const [userId, value] of totals) {
    if (value > best) {
      best = value;
      winner = userId;
    }
  }

  return winner;
}

/**
 * Determina la nominación Puskas ganadora: la que acumula más votos.
 * Devuelve null si no hay votos.
 */
export function computePuskasWinner(
  votes: { nomination_id: string; voter_id: string }[],
  nominations: { id: string; user_id: string }[],
): { nominationId: string; userId: string; votes: number } | null {
  if (votes.length === 0) {
    return null;
  }

  const counts = new Map<string, number>();
  for (const vote of votes) {
    counts.set(vote.nomination_id, (counts.get(vote.nomination_id) ?? 0) + 1);
  }

  let winnerNominationId: string | null = null;
  let best = -1;

  for (const [nominationId, count] of counts) {
    if (count > best) {
      best = count;
      winnerNominationId = nominationId;
    }
  }

  const nomination = nominations.find((n) => n.id === winnerNominationId);
  if (!nomination) {
    return null;
  }

  return {
    nominationId: nomination.id,
    userId: nomination.user_id,
    votes: best,
  };
}

/**
 * Regla del Cervezómetro: el Saco de Goles (debtor) invita a una jarra al
 * ganador del Puskas (creditor).
 */
export function resolveBeerDebt(
  sacoDeGolesUserId: string | null,
  puskasWinnerUserId: string | null,
): { debtorId: string; creditorId: string } | null {
  if (!sacoDeGolesUserId || !puskasWinnerUserId) {
    return null;
  }

  return { debtorId: sacoDeGolesUserId, creditorId: puskasWinnerUserId };
}
