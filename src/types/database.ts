export type UserRole = "admin" | "player";
export type UserStatus = "pending" | "approved" | "rejected";
export type TournamentStatus = "draft" | "active" | "knockout" | "finished";
export type MatchPhase =
  | "group"
  | "playin"
  | "round16"
  | "quarter"
  | "semi"
  | "final";
export type AwardCategory = "stat_derived" | "voting_derived";
export type BeerDebtStatus = "pending" | "settled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          role: UserRole;
          status: UserStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          theme: string;
          entry_fee: number;
          status: TournamentStatus;
          starts_at: string;
          cover_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          theme: string;
          entry_fee?: number;
          status?: TournamentStatus;
          starts_at: string;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          theme?: string;
          entry_fee?: number;
          status?: TournamentStatus;
          starts_at?: string;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tournament_participants: {
        Row: {
          tournament_id: string;
          user_id: string;
          team_name: string;
          team_logo_url: string | null;
          team_provider_id: string | null;
        };
        Insert: {
          tournament_id: string;
          user_id: string;
          team_name: string;
          team_logo_url?: string | null;
          team_provider_id?: string | null;
        };
        Update: {
          tournament_id?: string;
          user_id?: string;
          team_name?: string;
          team_logo_url?: string | null;
          team_provider_id?: string | null;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          provider_id: string;
          name: string;
          logo_url: string | null;
          country: string | null;
          updated_at: string;
        };
        Insert: {
          provider_id: string;
          name: string;
          logo_url?: string | null;
          country?: string | null;
          updated_at?: string;
        };
        Update: {
          provider_id?: string;
          name?: string;
          logo_url?: string | null;
          country?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          jornada: number;
          phase: MatchPhase;
          bracket_slot: number | null;
          leg: number | null;
          player1_id: string | null;
          player2_id: string | null;
          goals_p1: number | null;
          goals_p2: number | null;
          penalties_p1: number | null;
          penalties_p2: number | null;
          played: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          jornada: number;
          phase?: MatchPhase;
          bracket_slot?: number | null;
          leg?: number | null;
          player1_id?: string | null;
          player2_id?: string | null;
          goals_p1?: number | null;
          goals_p2?: number | null;
          penalties_p1?: number | null;
          penalties_p2?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          jornada?: number;
          phase?: MatchPhase;
          bracket_slot?: number | null;
          leg?: number | null;
          player1_id?: string | null;
          player2_id?: string | null;
          goals_p1?: number | null;
          goals_p2?: number | null;
          penalties_p1?: number | null;
          penalties_p2?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      award_definitions: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          icon: string;
          category: AwardCategory;
          penalty_payer_rule: string | null;
          active: boolean;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          icon: string;
          category: AwardCategory;
          penalty_payer_rule?: string | null;
          active?: boolean;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          icon?: string;
          category?: AwardCategory;
          penalty_payer_rule?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      tournament_awards: {
        Row: {
          id: string;
          tournament_id: string;
          award_definition_id: string;
          winner_id: string;
          sponsor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          award_definition_id: string;
          winner_id: string;
          sponsor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          award_definition_id?: string;
          winner_id?: string;
          sponsor_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      puskas_nominations: {
        Row: {
          id: string;
          tournament_id: string;
          match_id: string;
          user_id: string;
          video_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          match_id: string;
          user_id: string;
          video_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          match_id?: string;
          user_id?: string;
          video_url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      puskas_votes: {
        Row: {
          id: string;
          tournament_id: string;
          nomination_id: string;
          voter_id: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          nomination_id: string;
          voter_id: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          nomination_id?: string;
          voter_id?: string;
        };
        Relationships: [];
      };
      beer_debts: {
        Row: {
          id: string;
          tournament_id: string;
          debtor_id: string;
          creditor_id: string;
          status: BeerDebtStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          debtor_id: string;
          creditor_id: string;
          status?: BeerDebtStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          debtor_id?: string;
          creditor_id?: string;
          status?: BeerDebtStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      user_financials: {
        Row: {
          user_id: string;
          username: string;
          net_balance_eur: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      tournament_status: TournamentStatus;
      award_category: AwardCategory;
      beer_debt_status: BeerDebtStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
