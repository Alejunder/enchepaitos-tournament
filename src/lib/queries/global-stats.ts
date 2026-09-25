import { createClient } from "@/lib/supabase/server";

export interface GlobalScorer {
  userId: string;
  username: string;
  goalsFor: number;
  goalsAgainst: number;
}

export interface GlobalPuskas {
  userId: string;
  username: string;
  votes: number;
}

async function getUsernames(): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, username");

  return new Map((data ?? []).map((row) => [row.id, row.username]));
}

export async function getGlobalScorers(): Promise<GlobalScorer[]> {
  const supabase = await createClient();

  const [{ data: matches }, nameById] = await Promise.all([
    supabase
      .from("matches")
      .select("player1_id, player2_id, goals_p1, goals_p2")
      .eq("played", true),
    getUsernames(),
  ]);

  const table = new Map<string, GlobalScorer>();

  const ensure = (userId: string): GlobalScorer => {
    let row = table.get(userId);
    if (!row) {
      row = {
        userId,
        username: nameById.get(userId) ?? "—",
        goalsFor: 0,
        goalsAgainst: 0,
      };
      table.set(userId, row);
    }
    return row;
  };

  for (const match of matches ?? []) {
    if (match.goals_p1 === null || match.goals_p2 === null) {
      continue;
    }

    if (match.player1_id) {
      const row = ensure(match.player1_id);
      row.goalsFor += match.goals_p1;
      row.goalsAgainst += match.goals_p2;
    }

    if (match.player2_id) {
      const row = ensure(match.player2_id);
      row.goalsFor += match.goals_p2;
      row.goalsAgainst += match.goals_p1;
    }
  }

  return [...table.values()];
}

export async function getGlobalPuskas(): Promise<GlobalPuskas[]> {
  const supabase = await createClient();

  const [{ data: nominations }, { data: votes }, nameById] = await Promise.all([
    supabase.from("puskas_nominations").select("id, user_id"),
    supabase.from("puskas_votes").select("nomination_id"),
    getUsernames(),
  ]);

  const votesByNomination = new Map<string, number>();
  for (const vote of votes ?? []) {
    votesByNomination.set(
      vote.nomination_id,
      (votesByNomination.get(vote.nomination_id) ?? 0) + 1,
    );
  }

  const table = new Map<string, GlobalPuskas>();
  for (const nomination of nominations ?? []) {
    const row = table.get(nomination.user_id) ?? {
      userId: nomination.user_id,
      username: nameById.get(nomination.user_id) ?? "—",
      votes: 0,
    };
    row.votes += votesByNomination.get(nomination.id) ?? 0;
    table.set(nomination.user_id, row);
  }

  return [...table.values()];
}
