import { searchTeams } from "@/lib/teams";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  const teams = await searchTeams(query);

  return Response.json({ teams });
}
