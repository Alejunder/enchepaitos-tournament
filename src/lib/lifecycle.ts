import type { SupabaseClient } from "@supabase/supabase-js";

import { generateRoundRobin } from "@/lib/berger";
import {
  bracketFirstRoundSeeds,
  planKnockout,
  playInPairs,
  tieWinner,
  type KnockoutPlan,
} from "@/lib/knockout";
import { buildStandings } from "@/lib/standings";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Database,
  Match,
  MatchPhase,
  Participant,
  StandingRow,
} from "@/types";

type DB = SupabaseClient<Database>;

type ParticipantJoinRow = {
  user_id: string;
  team_name: string;
  profiles: { username: string } | { username: string }[] | null;
};

function extractUsername(profiles: ParticipantJoinRow["profiles"]): string {
  if (!profiles) return "—";
  if (Array.isArray(profiles)) return profiles[0]?.username ?? "—";
  return profiles.username;
}

async function fetchParticipants(
  client: DB,
  tournamentId: string,
): Promise<Participant[]> {
  const { data } = await client
    .from("tournament_participants")
    .select("user_id, team_name, profiles(username)")
    .eq("tournament_id", tournamentId);

  const rows = (data ?? []) as unknown as ParticipantJoinRow[];

  return rows.map((row) => ({
    userId: row.user_id,
    username: extractUsername(row.profiles),
    teamName: row.team_name,
  }));
}

async function generateGroupSchedule(client: DB, tournamentId: string) {
  const participants = await fetchParticipants(client, tournamentId);

  if (participants.length < 2) {
    return;
  }

  const schedule = generateRoundRobin(participants);
  const rows = schedule.flatMap((matchday) =>
    matchday.matches.map((match) => ({
      tournament_id: tournamentId,
      jornada: matchday.round,
      phase: "group" as const,
      player1_id: match.home.userId,
      player2_id: match.away.userId,
    })),
  );

  const { error } = await client.from("matches").insert(rows);
  if (error) throw error;

  await client
    .from("tournaments")
    .update({ status: "active" })
    .eq("id", tournamentId);
}

/**
 * Play-in y Final a partido único; Octavos, Cuartos y Semis a ida y vuelta.
 */
export function legsForPhase(phase: MatchPhase): number {
  if (phase === "playin" || phase === "final") {
    return 1;
  }
  return 2;
}

function resolveSeed(
  seed: number,
  plan: KnockoutPlan,
  standings: StandingRow[],
): string | null {
  if (seed <= plan.directQualifiers) {
    return standings[seed - 1]?.userId ?? null;
  }
  return null;
}

interface TieRow {
  tournament_id: string;
  phase: MatchPhase;
  jornada: number;
  bracket_slot: number;
  leg: number;
  player1_id: string | null;
  player2_id: string | null;
}

function pushTie(
  rows: TieRow[],
  tournamentId: string,
  phase: MatchPhase,
  jornada: number,
  slot: number,
  playerA: string | null,
  playerB: string | null,
) {
  const legs = legsForPhase(phase);

  rows.push({
    tournament_id: tournamentId,
    phase,
    jornada,
    bracket_slot: slot,
    leg: 1,
    player1_id: playerA,
    player2_id: playerB,
  });

  if (legs === 2) {
    // Vuelta: se intercambia local/visitante.
    rows.push({
      tournament_id: tournamentId,
      phase,
      jornada,
      bracket_slot: slot,
      leg: 2,
      player1_id: playerB,
      player2_id: playerA,
    });
  }
}

async function advanceToKnockoutWithClient(client: DB, tournamentId: string) {
  const { data: tournament } = await client
    .from("tournaments")
    .select("status")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!tournament) return;
  if (tournament.status === "knockout" || tournament.status === "finished") {
    return;
  }

  const participants = await fetchParticipants(client, tournamentId);

  const { data: groupMatches } = await client
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("phase", "group");

  const matches = (groupMatches ?? []) as Match[];
  if (matches.length === 0 || !matches.every((m) => m.played)) {
    return;
  }

  const standings = buildStandings(participants, matches);
  const plan = planKnockout(standings.length);

  const rows: TieRow[] = [];

  playInPairs(plan).forEach(([seedA, seedB], index) => {
    const slot = plan.directQualifiers + index + 1;
    pushTie(
      rows,
      tournamentId,
      "playin",
      0,
      slot,
      standings[seedA - 1]?.userId ?? null,
      standings[seedB - 1]?.userId ?? null,
    );
  });

  const seeds = bracketFirstRoundSeeds(plan.bracketSize);
  seeds.forEach(([seedA, seedB], index) => {
    pushTie(
      rows,
      tournamentId,
      plan.phases[0],
      1,
      index + 1,
      resolveSeed(seedA, plan, standings),
      resolveSeed(seedB, plan, standings),
    );
  });

  for (let round = 1; round < plan.phases.length; round++) {
    const phase = plan.phases[round];
    const count = plan.bracketSize / 2 ** (round + 1);
    for (let slot = 0; slot < count; slot++) {
      pushTie(rows, tournamentId, phase, round + 1, slot + 1, null, null);
    }
  }

  // Limpia eliminatorias previas (idempotente, evita duplicados) e inserta.
  await client
    .from("matches")
    .delete()
    .eq("tournament_id", tournamentId)
    .neq("phase", "group");

  const { error } = await client.from("matches").upsert(rows, {
    onConflict: "tournament_id,phase,bracket_slot,leg",
    ignoreDuplicates: true,
  });
  if (error) throw error;

  await client
    .from("tournaments")
    .update({ status: "knockout" })
    .eq("id", tournamentId);
}

/**
 * Resuelve un cruce (1 o 2 partidos). Si el agregado empata, deciden los
 * penaltis (registrados en el partido de vuelta o en el único partido).
 */
export { tieWinner };

async function syncKnockoutBracket(client: DB, tournamentId: string) {
  const { data } = await client
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .neq("phase", "group");

  const matches = (data ?? []) as Match[];
  if (matches.length === 0) return;

  const { count } = await client
    .from("tournament_participants")
    .select("user_id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  const plan = planKnockout(count ?? 0);
  const phases = plan.phases;

  const byPhase = new Map<string, Map<number, Match[]>>();
  for (const match of matches) {
    let phaseMap = byPhase.get(match.phase);
    if (!phaseMap) {
      phaseMap = new Map();
      byPhase.set(match.phase, phaseMap);
    }
    const slot = match.bracket_slot ?? 0;
    const tie = phaseMap.get(slot) ?? [];
    tie.push(match);
    phaseMap.set(slot, tie);
  }

  const tiesOf = (phase: MatchPhase): Match[][] => {
    const phaseMap = byPhase.get(phase);
    if (!phaseMap) return [];
    return [...phaseMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, tie]) => tie);
  };

  const firstRoundTies = tiesOf(phases[0]);

  const seeds = bracketFirstRoundSeeds(plan.bracketSize);
  const seedMap = new Map<
    number,
    { index: number; side: "player1_id" | "player2_id" }
  >();
  seeds.forEach(([a, b], index) => {
    seedMap.set(a, { index, side: "player1_id" });
    seedMap.set(b, { index, side: "player2_id" });
  });

  const updates = new Map<
    string,
    { player1_id?: string | null; player2_id?: string | null }
  >();

  const setTieSide = (
    tie: Match[],
    side: "player1_id" | "player2_id",
    value: string | null,
  ) => {
    const leg1 = tie.find((match) => match.leg === 1) ?? tie[0];
    const leg2 = tie.find((match) => match.leg === 2);

    if (leg1) {
      const existing = updates.get(leg1.id) ?? {};
      existing[side] = value;
      updates.set(leg1.id, existing);
    }

    // En la vuelta los equipos están intercambiados.
    if (leg2) {
      const opposite = side === "player1_id" ? "player2_id" : "player1_id";
      const existing = updates.get(leg2.id) ?? {};
      existing[opposite] = value;
      updates.set(leg2.id, existing);
    }
  };

  // Pre-clear slots de ganadores de play-in (puestos > directos)
  for (let slot = plan.directQualifiers + 1; slot <= plan.bracketSize; slot++) {
    const target = seedMap.get(slot);
    if (!target) continue;
    const tie = firstRoundTies[target.index];
    if (!tie) continue;
    setTieSide(tie, target.side, null);
  }

  // Pre-clear rondas posteriores (sin clasificados directos)
  for (let round = 1; round < phases.length; round++) {
    for (const tie of tiesOf(phases[round])) {
      setTieSide(tie, "player1_id", null);
      setTieSide(tie, "player2_id", null);
    }
  }

  // Ganadores de play-in → primera ronda
  for (const tie of tiesOf("playin")) {
    const winner = tieWinner(tie);
    if (!winner) continue;
    const slot = tie[0].bracket_slot ?? 0;
    const target = seedMap.get(slot);
    if (!target) continue;
    const firstTie = firstRoundTies[target.index];
    if (!firstTie) continue;
    setTieSide(firstTie, target.side, winner);
  }

  // Ganadores de cada ronda → siguiente ronda
  for (let round = 0; round < phases.length - 1; round++) {
    const current = tiesOf(phases[round]);
    const next = tiesOf(phases[round + 1]);

    current.forEach((tie, index) => {
      const winner = tieWinner(tie);
      if (!winner) return;
      const nextTie = next[Math.floor(index / 2)];
      if (!nextTie) return;
      const side = index % 2 === 0 ? "player1_id" : "player2_id";
      setTieSide(nextTie, side, winner);
    });
  }

  for (const [id, patch] of updates) {
    await client.from("matches").update(patch).eq("id", id);
  }
}

/**
 * Ciclo de vida automático (se ejecuta al leer el torneo):
 *  1. Si es draft y ya pasó la fecha → genera calendario de grupos.
 *  2. Si está activo y todos los grupos jugados → pasa a eliminatorias.
 *  3. Si está en eliminatorias → sincroniza ganadores en el bracket.
 */
export async function refreshTournamentLifecycle(tournamentId: string) {
  const client = createAdminClient();

  const { data: tournament } = await client
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .maybeSingle();

  if (!tournament) return;

  if (tournament.status === "draft") {
    const due = new Date(tournament.starts_at).getTime() <= Date.now();
    if (due) {
      await generateGroupSchedule(client, tournamentId);
    }
    return;
  }

  if (tournament.status === "active") {
    await advanceToKnockoutWithClient(client, tournamentId);
    return;
  }

  if (tournament.status === "knockout") {
    await syncKnockoutBracket(client, tournamentId);
  }
}

export { advanceToKnockoutWithClient, syncKnockoutBracket };
