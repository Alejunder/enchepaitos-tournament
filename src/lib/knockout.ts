import type { Match, MatchPhase } from "@/types";

export type BracketSize = 2 | 4 | 8 | 16;

export interface KnockoutPlan {
  participantCount: number;
  bracketSize: BracketSize;
  directQualifiers: number;
  playInMatches: number;
  eliminated: number;
  phases: MatchPhase[];
}

const BRACKET_PHASES: Record<BracketSize, MatchPhase[]> = {
  2: ["final"],
  4: ["semi", "final"],
  8: ["quarter", "semi", "final"],
  16: ["round16", "quarter", "semi", "final"],
};

/**
 * Tamaño de cuadro objetivo. La fase eliminatoria final debe ser siempre un
 * número par cerrado, pero con pocos jugadores se reduce:
 *   2 = Final directa, 4 = Semifinales, 8 = Cuartos, 16 = Octavos.
 */
export function bracketSizeFor(participantCount: number): BracketSize {
  if (participantCount <= 3) {
    return 2;
  }
  if (participantCount <= 8) {
    return 4;
  }
  if (participantCount <= 15) {
    return 8;
  }
  return 16;
}

/**
 * Plan de clasificación desde la fase de grupos.
 *
 * Casos pequeños:
 *   1-2 → final directa con byes.
 *   3   → el 1º va directo a la final y 2º vs 3º juegan la sub-eliminatoria.
 *
 * Casos generales (N >= 4):
 *   extra      = N - bracketSize
 *   playIns    = floor((extra - 1) / 2)   → sub-eliminatorias en el borde
 *   eliminados = extra - playIns
 *   directos   = bracketSize - playIns
 *
 * Verifica los ejemplos: 4→4 directos; 5→4 directos; 6→4 directos;
 * 7→3 directos + 1 play-in; 8→3 directos + 1 play-in; 9→8 directos.
 */
export function planKnockout(participantCount: number): KnockoutPlan {
  if (participantCount <= 2) {
    return {
      participantCount,
      bracketSize: 2,
      directQualifiers: participantCount,
      playInMatches: 0,
      eliminated: 0,
      phases: BRACKET_PHASES[2],
    };
  }

  if (participantCount === 3) {
    return {
      participantCount,
      bracketSize: 2,
      directQualifiers: 1,
      playInMatches: 1,
      eliminated: 0,
      phases: BRACKET_PHASES[2],
    };
  }

  const bracketSize = bracketSizeFor(participantCount);

  if (participantCount <= bracketSize) {
    return {
      participantCount,
      bracketSize,
      directQualifiers: participantCount,
      playInMatches: 0,
      eliminated: 0,
      phases: BRACKET_PHASES[bracketSize],
    };
  }

  const extra = participantCount - bracketSize;
  const playInMatches = Math.max(0, Math.floor((extra - 1) / 2));
  const eliminated = extra - playInMatches;
  const directQualifiers = bracketSize - playInMatches;

  return {
    participantCount,
    bracketSize,
    directQualifiers,
    playInMatches,
    eliminated,
    phases: BRACKET_PHASES[bracketSize],
  };
}

/**
 * Emparejamientos de la primera ronda del cuadro por semilla (1-indexada),
 * en orden de partido.
 */
export function bracketFirstRoundSeeds(
  bracketSize: BracketSize,
): [number, number][] {
  switch (bracketSize) {
    case 2:
      return [[1, 2]];
    case 4:
      return [
        [1, 4],
        [2, 3],
      ];
    case 8:
      return [
        [1, 8],
        [4, 5],
        [2, 7],
        [3, 6],
      ];
    case 16:
      return [
        [1, 16],
        [8, 9],
        [5, 12],
        [4, 13],
        [6, 11],
        [3, 14],
        [7, 10],
        [2, 15],
      ];
  }
}

/**
 * Emparejamientos de play-in: pares consecutivos de los puestos del borde
 * clasificatorio (D+1 vs D+2, D+3 vs D+4, ...). Cada ganador ocupa un slot
 * del bracket (D+1, D+2, ...).
 */
export function playInPairs(plan: KnockoutPlan): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < plan.playInMatches; i++) {
    pairs.push([
      plan.directQualifiers + i * 2 + 1,
      plan.directQualifiers + i * 2 + 2,
    ]);
  }
  return pairs;
}

/**
 * Agregado de un cruce, teniendo en cuenta el intercambio de local/visitante
 * entre la ida y la vuelta. `playerA` es el local de la ida (leg 1).
 */
export interface TieAggregate {
  playerA: string | null;
  playerB: string | null;
  aggA: number;
  aggB: number;
}

export function tieAggregate(tie: Match[]): TieAggregate {
  const sorted = [...tie].sort((a, b) => (a.leg ?? 0) - (b.leg ?? 0));
  const playerA = sorted[0]?.player1_id ?? null;
  const playerB = sorted[0]?.player2_id ?? null;

  let aggA = 0;
  let aggB = 0;

  for (const match of sorted) {
    if (match.player1_id === playerA) {
      aggA += match.goals_p1 ?? 0;
      aggB += match.goals_p2 ?? 0;
    } else if (match.player2_id === playerA) {
      aggA += match.goals_p2 ?? 0;
      aggB += match.goals_p1 ?? 0;
    }
  }

  return { playerA, playerB, aggA, aggB };
}

/**
 * Resuelve un cruce (1 o 2 partidos). Si el agregado de los dos partidos
 * empata, deciden los penaltis (registrados en la vuelta o en el único).
 */
export function tieWinner(tie: Match[]): string | null {
  if (tie.length === 0 || !tie.every((match) => match.played)) {
    return null;
  }

  const { playerA, playerB, aggA, aggB } = tieAggregate(tie);

  if (aggA !== aggB) {
    return aggA > aggB ? playerA : playerB;
  }

  const decider = tie.find((match) => match.leg === 2) ?? tie[0];
  if (
    decider.penalties_p1 === null ||
    decider.penalties_p2 === null ||
    decider.penalties_p1 === decider.penalties_p2
  ) {
    return null;
  }

  return decider.penalties_p1 > decider.penalties_p2
    ? decider.player1_id
    : decider.player2_id;
}
