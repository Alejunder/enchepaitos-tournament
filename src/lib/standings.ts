import type { Match, Participant, StandingRow } from "@/types";

const POINTS_WIN = 3;
const POINTS_DRAW = 1;

export function buildStandings(
  participants: Participant[],
  matches: Pick<
    Match,
    "player1_id" | "player2_id" | "goals_p1" | "goals_p2" | "played"
  >[],
): StandingRow[] {
  const table = new Map<string, StandingRow>();

  for (const participant of participants) {
    table.set(participant.userId, {
      userId: participant.userId,
      username: participant.username,
      teamName: participant.teamName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
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

    const home = table.get(match.player1_id);
    const away = table.get(match.player2_id);

    if (!home || !away) {
      continue;
    }

    applyResult(home, match.goals_p1, match.goals_p2);
    applyResult(away, match.goals_p2, match.goals_p1);
  }

  return [...table.values()].sort(compareStandings);
}

function applyResult(row: StandingRow, scored: number, conceded: number) {
  row.played += 1;
  row.goalsFor += scored;
  row.goalsAgainst += conceded;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (scored > conceded) {
    row.won += 1;
    row.points += POINTS_WIN;
  } else if (scored === conceded) {
    row.drawn += 1;
    row.points += POINTS_DRAW;
  } else {
    row.lost += 1;
  }
}

function compareStandings(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) {
    return b.goalDifference - a.goalDifference;
  }
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.username.localeCompare(b.username);
}
