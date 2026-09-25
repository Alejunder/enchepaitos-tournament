import type { Database } from "./database";

export type { Database } from "./database";
export type {
  AwardCategory,
  BeerDebtStatus,
  MatchPhase,
  TournamentStatus,
  UserRole,
  UserStatus,
} from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentParticipant =
  Database["public"]["Tables"]["tournament_participants"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type AwardDefinition =
  Database["public"]["Tables"]["award_definitions"]["Row"];
export type TournamentAward =
  Database["public"]["Tables"]["tournament_awards"]["Row"];
export type PuskasNomination =
  Database["public"]["Tables"]["puskas_nominations"]["Row"];
export type PuskasVote = Database["public"]["Tables"]["puskas_votes"]["Row"];
export type BeerDebt = Database["public"]["Tables"]["beer_debts"]["Row"];

export interface Participant {
  userId: string;
  username: string;
  teamName: string;
}

export interface ScheduledMatch {
  home: Participant;
  away: Participant;
}

export interface Matchday {
  round: number;
  matches: ScheduledMatch[];
}

export interface H2HMatchRecord {
  tournamentName: string;
  tournamentTheme: string;
  player1Team: string;
  player2Team: string;
  goalsP1: number;
  goalsP2: number;
  date: string;
}

export interface H2HSummary {
  matchesPlayed: number;
  winsPlayerA: number;
  winsPlayerB: number;
  draws: number;
  goalsPlayerA: number;
  goalsPlayerB: number;
  history: H2HMatchRecord[];
}

export interface StandingRow {
  userId: string;
  username: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "UNAUTHORIZED_PENDING_APPROVAL"
  | "NOT_ADMIN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNKNOWN";
