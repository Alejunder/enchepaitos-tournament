import type { Matchday, Participant, ScheduledMatch } from "@/types";

export const BYE_USER_ID = "__BYE__";

function createByeParticipant(): Participant {
  return { userId: BYE_USER_ID, username: "DESCANSA", teamName: "-" };
}

/**
 * Genera un calendario todos-contra-todos (round-robin) usando el algoritmo
 * de rotación de Berger. Si el número de participantes es impar se añade un
 * participante ficticio ("DESCANSA") que hace de descanso.
 */
export function generateRoundRobin(participants: Participant[]): Matchday[] {
  const list = [...participants];

  if (list.length < 2) {
    return [];
  }

  if (list.length % 2 !== 0) {
    list.push(createByeParticipant());
  }

  const n = list.length;
  const roundsCount = n - 1;
  const matchesPerRound = n / 2;
  const schedule: Matchday[] = [];

  for (let round = 0; round < roundsCount; round++) {
    const roundMatches: ScheduledMatch[] = [];

    for (let i = 0; i < matchesPerRound; i++) {
      const home = list[i];
      const away = list[n - 1 - i];

      if (home.userId !== BYE_USER_ID && away.userId !== BYE_USER_ID) {
        roundMatches.push({ home, away });
      }
    }

    schedule.push({ round: round + 1, matches: roundMatches });

    list.splice(1, 0, list.pop() as Participant);
  }

  return schedule;
}
