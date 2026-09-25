import type { Participant } from "@/types";

export const FINALIZED_TOURNAMENT_STATUS = "finished";

export interface FinancialInput {
  participants: Participant[];
  championUserId: string | null;
}

/**
 * Calcula el saldo de un usuario segun la formula de SPEC-004:
 *   Saldo_i = Σ_{t ∈ T_w(i)} (N_t × 5) − Σ_{t ∈ T_p(i)} 5
 * donde T_p son torneos jugados (finalizados), T_w los ganados y N_t el
 * numero de participantes del torneo t.
 */
export function computeUserBalance(
  entryFee: number,
  tournaments: FinancialInput[],
  userId: string,
): number {
  let totalWon = 0;
  let totalSpent = 0;

  for (const tournament of tournaments) {
    const isParticipant = tournament.participants.some(
      (p) => p.userId === userId,
    );

    if (!isParticipant) {
      continue;
    }

    totalSpent += entryFee;

    if (tournament.championUserId === userId) {
      totalWon += tournament.participants.length * entryFee;
    }
  }

  return totalWon - totalSpent;
}
