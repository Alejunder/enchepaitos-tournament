"use server";

import { revalidatePath } from "next/cache";

import {
  computePuskasWinner,
  computeStatAwards,
  resolveBeerDebt,
} from "@/lib/awards";
import { getCurrentProfile } from "@/lib/auth";
import {
  canAdmin,
  canWrite,
  NOT_ADMIN,
  UNAUTHORIZED,
  UNAUTHORIZED_PENDING_APPROVAL,
} from "@/lib/guards";
import {
  getAwardDefinitions,
  getPuskasNominations,
  getPuskasVotes,
} from "@/lib/queries/awards";
import { getTournamentBundle } from "@/lib/queries/tournaments";
import { tieWinner } from "@/lib/knockout";
import { createClient } from "@/lib/supabase/server";
import type { ActionErrorCode, ActionResult } from "@/types";

function revalidateTournament(id: string) {
  revalidatePath(`/torneos/${id}`);
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

export async function createPuskasNomination(
  tournamentId: string,
  matchId: string,
  videoUrl: string,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return UNAUTHORIZED;
  }

  if (!canWrite(profile)) {
    return UNAUTHORIZED_PENDING_APPROVAL;
  }

  if (!videoUrl || !/^https?:\/\//.test(videoUrl)) {
    return {
      success: false,
      error: "La URL del vídeo no es válida.",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("puskas_nominations").insert({
    tournament_id: tournamentId,
    match_id: matchId,
    user_id: profile.id,
    video_url: videoUrl,
  });

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function votePuskas(
  nominationId: string,
  tournamentId: string,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return UNAUTHORIZED;
  }

  if (!canWrite(profile)) {
    return UNAUTHORIZED_PENDING_APPROVAL;
  }

  const supabase = await createClient();

  const { error } = await supabase.from("puskas_votes").insert({
    tournament_id: tournamentId,
    nomination_id: nominationId,
    voter_id: profile.id,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "Ya has votado en este torneo.",
        code: "CONFLICT",
      };
    }
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}

export async function closeTournament(
  tournamentId: string,
): Promise<ActionResult<{ awards: number; beer: boolean }>> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const bundle = await getTournamentBundle(tournamentId);

  if (!bundle) {
    return { success: false, error: "Torneo no encontrado.", code: "NOT_FOUND" };
  }

  if (bundle.tournament.status === "finished") {
    return {
      success: false,
      error: "El torneo ya está finalizado.",
      code: "CONFLICT",
    };
  }

  if (bundle.participants.length < 2) {
    return {
      success: false,
      error: "Se necesitan al menos 2 participantes.",
      code: "VALIDATION_ERROR",
    };
  }

  const statAwards = computeStatAwards(bundle.participants, bundle.matches);

  const finalMatches = (bundle.knockoutMatches ?? []).filter(
    (match) => match.phase === "final",
  );
  const finalWinner =
    finalMatches.length > 0 ? tieWinner(finalMatches) : null;
  const champion = finalWinner ?? bundle.standings[0]?.userId ?? null;

  const nominations = await getPuskasNominations(tournamentId);
  const votes = await getPuskasVotes(tournamentId);

  const puskas = computePuskasWinner(
    votes.map((vote) => ({
      nomination_id: vote.nomination_id,
      voter_id: vote.voter_id,
    })),
    nominations.map((nomination) => ({
      id: nomination.id,
      user_id: nomination.user_id,
    })),
  );

  const beer = resolveBeerDebt(statAwards.sacoDeGoles, puskas?.userId ?? null);

  const definitions = await getAwardDefinitions();
  const definitionIdByCode = new Map(
    definitions.map((definition) => [definition.code, definition.id]),
  );

  const awardRows = [
    { code: "champion", winnerId: champion },
    { code: "bota_de_oro", winnerId: statAwards.botaDeOro },
    { code: "saco_de_goles", winnerId: statAwards.sacoDeGoles },
    { code: "puskas", winnerId: puskas?.userId ?? null },
  ]
    .filter((award) => award.winnerId !== null)
    .map((award) => {
      const awardDefinitionId = definitionIdByCode.get(award.code);
      if (!awardDefinitionId) {
        return null;
      }

      return {
        tournament_id: tournamentId,
        award_definition_id: awardDefinitionId,
        winner_id: award.winnerId as string,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const supabase = await createClient();

  if (awardRows.length > 0) {
    const { error } = await supabase
      .from("tournament_awards")
      .upsert(awardRows, {
        onConflict: "tournament_id,award_definition_id",
        ignoreDuplicates: true,
      });

    if (error) {
      return { success: false, error: error.message, code: "UNKNOWN" };
    }
  }

  if (beer) {
    const { error } = await supabase
      .from("beer_debts")
      .upsert(
        {
          tournament_id: tournamentId,
          debtor_id: beer.debtorId,
          creditor_id: beer.creditorId,
        },
        { onConflict: "tournament_id", ignoreDuplicates: true },
      );

    if (error) {
      return { success: false, error: error.message, code: "UNKNOWN" };
    }
  }

  const { error: statusError } = await supabase
    .from("tournaments")
    .update({ status: "finished" })
    .eq("id", tournamentId);

  if (statusError) {
    return { success: false, error: statusError.message, code: "UNKNOWN" };
  }

  revalidatePath("/torneos");
  revalidatePath(`/torneos/${tournamentId}`);
  revalidatePath("/admin/tournaments");
  revalidatePath(`/admin/tournaments/${tournamentId}`);

  return {
    success: true,
    data: { awards: awardRows.length, beer: beer !== null },
  };
}

export async function deletePuskasNomination(
  nominationId: string,
  tournamentId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) {
    return denied;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("puskas_nominations")
    .delete()
    .eq("id", nominationId);

  if (error) {
    return { success: false, error: error.message, code: "UNKNOWN" };
  }

  revalidateTournament(tournamentId);

  return { success: true, data: null };
}
