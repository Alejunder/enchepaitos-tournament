import { buildStandings } from "@/lib/standings";
import { createClient } from "@/lib/supabase/server";
import type {
  Match,
  MatchPhase,
  Participant,
  StandingRow,
  Tournament,
} from "@/types";

export interface TournamentListItem extends Tournament {
  participantCount: number;
}

export interface TournamentBundle {
  tournament: Tournament;
  participants: Participant[];
  matches: Match[];
  knockoutMatches: Match[];
  standings: StandingRow[];
}

type TournamentCountRow = Tournament & {
  tournament_participants: { count: number }[] | null;
};

type ParticipantJoinRow = {
  user_id: string;
  team_name: string;
  team_logo_url: string | null;
  profiles: { username: string } | { username: string }[] | null;
};

export async function listTournaments(): Promise<TournamentListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournaments")
    .select("*, tournament_participants(count)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as TournamentCountRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    theme: row.theme,
    entry_fee: row.entry_fee,
    status: row.status,
    starts_at: row.starts_at,
    cover_image_url: row.cover_image_url,
    created_at: row.created_at,
    participantCount: row.tournament_participants?.[0]?.count ?? 0,
  }));
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCurrentTournament(): Promise<TournamentListItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournaments")
    .select("*, tournament_participants(count)")
    .in("status", ["draft", "active", "knockout"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as TournamentCountRow;

  return {
    id: row.id,
    name: row.name,
    theme: row.theme,
    entry_fee: row.entry_fee,
    status: row.status,
    starts_at: row.starts_at,
    cover_image_url: row.cover_image_url,
    created_at: row.created_at,
    participantCount: row.tournament_participants?.[0]?.count ?? 0,
  };
}

export async function getParticipants(
  tournamentId: string,
): Promise<Participant[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournament_participants")
    .select("user_id, team_name, team_logo_url, profiles(username)")
    .eq("tournament_id", tournamentId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as ParticipantJoinRow[];

  return rows.map((row) => ({
    userId: row.user_id,
    username: extractUsername(row.profiles),
    teamName: row.team_name,
    teamLogoUrl: row.team_logo_url,
  }));
}

function extractUsername(profiles: ParticipantJoinRow["profiles"]): string {
  if (!profiles) {
    return "—";
  }

  if (Array.isArray(profiles)) {
    return profiles[0]?.username ?? "—";
  }

  return profiles.username;
}

export async function getMatches(
  tournamentId: string,
  phase?: MatchPhase,
): Promise<Match[]> {
  const supabase = await createClient();

  let query = supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId);

  if (phase) {
    query = query.eq("phase", phase);
  }

  const { data, error } = await query
    .order("jornada", { ascending: true })
    .order("bracket_slot", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Match[];
}

export async function getGroupMatches(tournamentId: string): Promise<Match[]> {
  return getMatches(tournamentId, "group");
}

export async function getKnockoutMatches(
  tournamentId: string,
): Promise<Match[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .neq("phase", "group")
    .order("jornada", { ascending: true })
    .order("bracket_slot", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Match[];
}

export async function getTournamentBundle(
  id: string,
): Promise<TournamentBundle | null> {
  const tournament = await getTournament(id);

  if (!tournament) {
    return null;
  }

  const [participants, matches, knockoutMatches] = await Promise.all([
    getParticipants(id),
    getGroupMatches(id),
    getKnockoutMatches(id),
  ]);

  return {
    tournament,
    participants,
    matches,
    knockoutMatches,
    standings: buildStandings(participants, matches),
  };
}

export function isParticipant(
  participants: Participant[],
  userId: string | undefined,
): boolean {
  if (!userId) {
    return false;
  }

  return participants.some((participant) => participant.userId === userId);
}

export interface JornadaProgress {
  total: number;
  current: number | null;
  played: number[];
}

export function getJornadaProgress(matches: Match[]): JornadaProgress {
  const byJornada = new Map<number, Match[]>();
  for (const match of matches) {
    const list = byJornada.get(match.jornada) ?? [];
    list.push(match);
    byJornada.set(match.jornada, list);
  }

  const jornadas = [...byJornada.keys()].sort((a, b) => a - b);

  const played: number[] = [];
  let current: number | null = null;

  for (const jornada of jornadas) {
    const allPlayed = (byJornada.get(jornada) ?? []).every((m) => m.played);
    if (allPlayed) {
      played.push(jornada);
    } else if (current === null) {
      current = jornada;
    }
  }

  return { total: jornadas.length, current, played };
}

export interface AddableUser {
  id: string;
  username: string;
}

export async function getAddableUsers(
  tournamentId: string,
): Promise<AddableUser[]> {
  const supabase = await createClient();

  const { data: enrolled } = await supabase
    .from("tournament_participants")
    .select("user_id")
    .eq("tournament_id", tournamentId);

  const enrolledIds = new Set(
    (enrolled ?? []).map((row) => row.user_id),
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("status", "approved")
    .order("username", { ascending: true });

  return (profiles ?? [])
    .filter((profile) => !enrolledIds.has(profile.id))
    .map((profile) => ({ id: profile.id, username: profile.username }));
}
