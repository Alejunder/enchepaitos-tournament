import { createAdminClient } from "@/lib/supabase/admin";

export interface TeamSearchResult {
  id: string;
  name: string;
  logo: string | null;
  country: string | null;
}

const SPORTSDB_KEY = process.env.THESPORTSDB_KEY || "3";
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";

interface SportsDbTeam {
  idTeam: string;
  strTeam: string;
  strBadge: string | null;
  strCountry: string | null;
  strSport: string;
}

export async function searchTeams(query: string): Promise<TeamSearchResult[]> {
  const q = query.trim();

  if (q.length < 2) {
    return [];
  }

  const admin = createAdminClient();

  // 1) Caché local en Supabase
  const { data: cached } = await admin
    .from("teams")
    .select("provider_id, name, logo_url, country")
    .ilike("name", `%${q}%`)
    .limit(8);

  if (cached && cached.length > 0) {
    return cached.map((team) => ({
      id: team.provider_id,
      name: team.name,
      logo: team.logo_url,
      country: team.country,
    }));
  }

  // 2) TheSportsDB (solo fútbol)
  const url = `${SPORTSDB_BASE}/${SPORTSDB_KEY}/searchteams.php?t=${encodeURIComponent(q)}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as { teams: SportsDbTeam[] | null };
  const teams = (json.teams ?? [])
    .filter((team) => team.strSport === "Soccer")
    .slice(0, 8);

  const rows = teams.map((team) => ({
    provider_id: team.idTeam,
    name: team.strTeam,
    logo_url: team.strBadge ?? null,
    country: team.strCountry ?? null,
  }));

  if (rows.length > 0) {
    await admin
      .from("teams")
      .upsert(rows, { onConflict: "provider_id", ignoreDuplicates: true });
  }

  return rows.map((team) => ({
    id: team.provider_id,
    name: team.name,
    logo: team.logo_url,
    country: team.country,
  }));
}
