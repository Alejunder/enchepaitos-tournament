import { createClient } from "@/lib/supabase/server";
import type { AwardDefinition, BeerDebt } from "@/types";

export interface PuskasNominationWithMeta {
  id: string;
  tournament_id: string;
  match_id: string;
  user_id: string;
  video_url: string;
  created_at: string;
  username: string;
}

export interface PuskasVoteRow {
  nomination_id: string;
  voter_id: string;
}

export interface TournamentAwardWithMeta {
  id: string;
  award_definition_id: string;
  winner_id: string;
  sponsor_id: string | null;
  award_definitions: {
    code: string;
    name: string;
    icon: string;
    category: string;
  } | null;
}

type NominationRow = Omit<PuskasNominationWithMeta, "username"> & {
  profiles: { username: string } | { username: string }[] | null;
};

export async function getAwardDefinitions(): Promise<AwardDefinition[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("award_definitions")
    .select("*")
    .eq("active", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AwardDefinition[];
}

export async function getTournamentAwards(
  tournamentId: string,
): Promise<TournamentAwardWithMeta[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournament_awards")
    .select(
      "id, award_definition_id, winner_id, sponsor_id, award_definitions(code, name, icon, category)",
    )
    .eq("tournament_id", tournamentId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as TournamentAwardWithMeta[];
}

export async function getPuskasNominations(
  tournamentId: string,
): Promise<PuskasNominationWithMeta[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("puskas_nominations")
    .select(
      "id, tournament_id, match_id, user_id, video_url, created_at, profiles(username)",
    )
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as NominationRow[];

  return rows.map((row) => ({
    id: row.id,
    tournament_id: row.tournament_id,
    match_id: row.match_id,
    user_id: row.user_id,
    video_url: row.video_url,
    created_at: row.created_at,
    username: extractUsername(row.profiles),
  }));
}

export async function getPuskasVotes(
  tournamentId: string,
): Promise<PuskasVoteRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("puskas_votes")
    .select("nomination_id, voter_id")
    .eq("tournament_id", tournamentId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PuskasVoteRow[];
}

export async function getBeerDebts(tournamentId: string): Promise<BeerDebt[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beer_debts")
    .select("*")
    .eq("tournament_id", tournamentId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BeerDebt[];
}

function extractUsername(
  profiles: NominationRow["profiles"],
): string {
  if (!profiles) {
    return "—";
  }

  if (Array.isArray(profiles)) {
    return profiles[0]?.username ?? "—";
  }

  return profiles.username;
}
