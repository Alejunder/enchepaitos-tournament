"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth";
import { generateRoundRobin } from "@/lib/berger";
import {
  canAdmin,
  canWrite,
  NOT_ADMIN,
  UNAUTHORIZED,
  UNAUTHORIZED_PENDING_APPROVAL,
} from "@/lib/guards";
import {
  advanceToKnockoutWithClient,
  syncKnockoutBracket,
} from "@/lib/lifecycle";
import {
  getMatches,
  getParticipants,
  getTournament,
} from "@/lib/queries/tournaments";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  ActionErrorCode,
  ActionResult,
  TournamentStatus,
} from "@/types";
import {
  validateScore,
  validateTeamName,
  validateTournamentInput,
  type TournamentInput,
} from "@/lib/validation";

function revalidateTournament(id: string) {
  revalidatePath("/torneos");
  revalidatePath(`/torneos/${id}`);
  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${id}`);
}

interface Denial {
  success: false;
  error: string;
  code: ActionErrorCode;
}

async function requireAdmin(): Promise<Denial | null> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return UNAUTHORIZED;
  }

  if (!canAdmin(profile)) {
    return NOT_ADMIN;
  }

  return null;
}

export async function createTournament(
  input: TournamentInput,
): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const validationError = validateTournamentInput(input);
  if (validationError) {
    return { success: false, error: validationError, code: "VALIDATION_ERROR" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name: input.theme.trim(),
      theme: input.theme.trim(),
      entry_fee: input.entryFee ?? 5,
      starts_at: new Date(input.startsAt).toISOString(),
      cover_image_url: input.coverImageUrl ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidatePath("/admin/tournaments");
  revalidatePath("/torneos");

  return { success: true, data: { id: data.id } };
}

export async function enrollInTournament(
  tournamentId: string,
  teamName: string,
  teamLogoUrl?: string | null,
  teamProviderId?: string | null,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return UNAUTHORIZED;
  }

  if (!canWrite(profile)) {
    return UNAUTHORIZED_PENDING_APPROVAL;
  }

  const teamError = validateTeamName(teamName);
  if (teamError) {
    return { success: false, error: teamError, code: "VALIDATION_ERROR" };
  }

  const tournament = await getTournament(tournamentId);
  if (!tournament) {
    return { success: false, error: "Torneo no encontrado.", code: "NOT_FOUND" };
  }

  if (tournament.status === "finished") {
    return {
      success: false,
      error: "El torneo ya ha finalizado.",
      code: "CONFLICT",
    };
  }

  if (tournament.status !== "draft") {
    return {
      success: false,
      error: "El torneo ya ha comenzado, no se aceptan inscripciones.",
      code: "CONFLICT",
    };
  }

  if (
    tournament.starts_at &&
    new Date(tournament.starts_at).getTime() <= Date.now()
  ) {
    return {
      success: false,
      error: "El plazo de inscripción ha finalizado.",
      code: "CONFLICT",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("tournament_participants").insert({
    tournament_id: tournamentId,
    user_id: profile.id,
    team_name: teamName.trim(),
    team_logo_url: teamLogoUrl ?? null,
    team_provider_id: teamProviderId ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "Ya estás inscrito en este torneo.",
        code: "CONFLICT",
      };
    }
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function generateSchedule(
  tournamentId: string,
): Promise<ActionResult<{ matches: number }>> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const participants = await getParticipants(tournamentId);

  if (participants.length < 2) {
    return {
      success: false,
      error: "Se necesitan al menos 2 participantes para generar el calendario.",
      code: "VALIDATION_ERROR",
    };
  }

  const existing = await getMatches(tournamentId);
  if (existing.length > 0) {
    return {
      success: false,
      error: "Ya existe un calendario. Elimínalo para regenerarlo.",
      code: "CONFLICT",
    };
  }

  const schedule = generateRoundRobin(participants);

  const rows = schedule.flatMap((matchday) =>
    matchday.matches.map((match) => ({
      tournament_id: tournamentId,
      jornada: matchday.round,
      player1_id: match.home.userId,
      player2_id: match.away.userId,
    })),
  );

  if (rows.length === 0) {
    return {
      success: false,
      error: "No se pudieron generar enfrentamientos.",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("matches").insert(rows);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  await supabase
    .from("tournaments")
    .update({ status: "active" })
    .eq("id", tournamentId);

  revalidateTournament(tournamentId);

  return { success: true, data: { matches: rows.length } };
}

export async function deleteSchedule(
  tournamentId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("tournament_id", tournamentId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  await supabase
    .from("tournaments")
    .update({ status: "draft" })
    .eq("id", tournamentId);

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function updateMatchResult(
  matchId: string,
  tournamentId: string,
  goalsP1: number,
  goalsP2: number,
  penaltiesP1?: number | null,
  penaltiesP2?: number | null,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const scoreError = validateScore(goalsP1) ?? validateScore(goalsP2);
  if (scoreError) {
    return { success: false, error: scoreError, code: "VALIDATION_ERROR" };
  }

  const penaltiesError =
    penaltiesP1 != null && penaltiesP2 != null
      ? validateScore(penaltiesP1) ?? validateScore(penaltiesP2)
      : null;
  if (penaltiesError) {
    return { success: false, error: penaltiesError, code: "VALIDATION_ERROR" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("matches")
    .update({
      goals_p1: goalsP1,
      goals_p2: goalsP2,
      penalties_p1: penaltiesP1 ?? null,
      penalties_p2: penaltiesP2 ?? null,
    })
    .eq("id", matchId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  await syncKnockoutBracket(createAdminClient(), tournamentId);

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function clearMatchResult(
  matchId: string,
  tournamentId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("matches")
    .update({
      goals_p1: null,
      goals_p2: null,
      penalties_p1: null,
      penalties_p2: null,
    })
    .eq("id", matchId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  await syncKnockoutBracket(createAdminClient(), tournamentId);

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function setTournamentStatus(
  tournamentId: string,
  status: TournamentStatus,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tournaments")
    .update({ status })
    .eq("id", tournamentId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function updateTournament(
  tournamentId: string,
  input: TournamentInput,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const validationError = validateTournamentInput(input);
  if (validationError) {
    return { success: false, error: validationError, code: "VALIDATION_ERROR" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tournaments")
    .update({
      name: input.theme.trim(),
      theme: input.theme.trim(),
      entry_fee: input.entryFee ?? 5,
      starts_at: new Date(input.startsAt).toISOString(),
      cover_image_url: input.coverImageUrl ?? null,
    })
    .eq("id", tournamentId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function deleteTournament(
  tournamentId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", tournamentId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidatePath("/torneos");
  revalidatePath("/admin/tournaments");

  return { success: true, data: null };
}

export async function removeParticipant(
  tournamentId: string,
  userId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tournament_participants")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function updateParticipantTeam(
  tournamentId: string,
  userId: string,
  teamName: string,
  teamLogoUrl?: string | null,
  teamProviderId?: string | null,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const teamError = validateTeamName(teamName);
  if (teamError) {
    return { success: false, error: teamError, code: "VALIDATION_ERROR" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tournament_participants")
    .update({
      team_name: teamName.trim(),
      team_logo_url: teamLogoUrl ?? null,
      team_provider_id: teamProviderId ?? null,
    })
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function advanceToKnockout(
  tournamentId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  await advanceToKnockoutWithClient(createAdminClient(), tournamentId);

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function addParticipant(
  tournamentId: string,
  userId: string,
  teamName: string,
  teamLogoUrl?: string | null,
  teamProviderId?: string | null,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  if (!userId) {
    return {
      success: false,
      error: "Selecciona un usuario.",
      code: "VALIDATION_ERROR",
    };
  }

  const teamError = validateTeamName(teamName);
  if (teamError) {
    return { success: false, error: teamError, code: "VALIDATION_ERROR" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("tournament_participants").insert({
    tournament_id: tournamentId,
    user_id: userId,
    team_name: teamName.trim(),
    team_logo_url: teamLogoUrl ?? null,
    team_provider_id: teamProviderId ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "El usuario ya está inscrito en este torneo.",
        code: "CONFLICT",
      };
    }
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}
