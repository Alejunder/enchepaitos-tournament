import { buildH2HSummary } from "@/lib/h2h";
import { createClient } from "@/lib/supabase/server";
import type { H2HSummary, Match } from "@/types";

export interface PlayerOption {
  id: string;
  username: string;
}

interface H2HMatchRow {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  goals_p1: number | null;
  goals_p2: number | null;
  updated_at: string;
  tournaments:
    | { name: string; theme: string }
    | { name: string; theme: string }[]
    | null;
}

export async function listPlayers(): Promise<PlayerOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("status", "approved")
    .order("username", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PlayerOption[];
}

export async function getH2HSummary(
  playerAId: string,
  playerBId: string,
): Promise<H2HSummary> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, tournament_id, player1_id, player2_id, goals_p1, goals_p2, updated_at, tournaments(name, theme)",
    )
    .or(
      `and(player1_id.eq.${playerAId},player2_id.eq.${playerBId}),and(player1_id.eq.${playerBId},player2_id.eq.${playerAId})`,
    );

  if (error) {
    throw new Error(error.message);
  }

  const matches = (data ?? []) as unknown as H2HMatchRow[];

  if (matches.length === 0) {
    return {
      matchesPlayed: 0,
      winsPlayerA: 0,
      winsPlayerB: 0,
      draws: 0,
      goalsPlayerA: 0,
      goalsPlayerB: 0,
      history: [],
    };
  }

  const tournamentIds = [...new Set(matches.map((match) => match.tournament_id))];

  const { data: participants } = await supabase
    .from("tournament_participants")
    .select("tournament_id, user_id, team_name")
    .in("tournament_id", tournamentIds)
    .in("user_id", [playerAId, playerBId]);

  const teamByKey = new Map<string, string>();
  for (const row of (participants ?? []) as {
    tournament_id: string;
    user_id: string;
    team_name: string;
  }[]) {
    teamByKey.set(`${row.tournament_id}:${row.user_id}`, row.team_name);
  }

  const context = matches.map((match) => {
    const tournament = extractTournament(match.tournaments);

    return {
      match: {
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        goals_p1: match.goals_p1,
        goals_p2: match.goals_p2,
        played: match.goals_p1 !== null && match.goals_p2 !== null,
        updated_at: match.updated_at,
      } as Pick<
        Match,
        "player1_id" | "player2_id" | "goals_p1" | "goals_p2" | "played" | "updated_at"
      >,
      tournamentName: tournament?.name ?? "—",
      tournamentTheme: tournament?.theme ?? "",
      player1Team:
        teamByKey.get(`${match.tournament_id}:${match.player1_id}`) ?? "—",
      player2Team:
        teamByKey.get(`${match.tournament_id}:${match.player2_id}`) ?? "—",
    };
  });

  return buildH2HSummary(playerAId, playerBId, context);
}

function extractTournament(
  tournaments: H2HMatchRow["tournaments"],
): { name: string; theme: string } | null {
  if (!tournaments) {
    return null;
  }

  if (Array.isArray(tournaments)) {
    return tournaments[0] ?? null;
  }

  return tournaments;
}
