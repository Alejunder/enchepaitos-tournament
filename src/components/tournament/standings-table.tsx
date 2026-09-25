import { TeamBadge } from "@/components/ui/team-badge";
import { cn } from "@/lib/utils";
import type { StandingRow } from "@/types";

const HEADERS = ["#", "Jugador (Equipo)", "PJ", "G", "E", "P", "GF", "GC", "DG", "Pts"];

export function StandingsTable({ standings }: { standings: StandingRow[] }) {
  if (standings.length === 0) {
    return (
      <p className="text-sm text-chalk/50">Aún no hay participantes.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-chalk/15 text-left text-xs uppercase tracking-wider text-chalk/50">
            {HEADERS.map((header, index) => (
              <th
                key={header}
                className={cn("px-3 py-2", index <= 1 ? "text-left" : "text-center")}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => (
            <tr
              key={row.userId}
              className="border-b border-chalk/10 last:border-0"
            >
              <td className="px-3 py-2 text-chalk/50">{index + 1}</td>
              <td className="px-3 py-2 font-medium text-chalk">
                {row.username}{" "}
                <span className="inline-flex items-center gap-1.5 align-middle text-chalk/50">
                  <TeamBadge src={row.teamLogoUrl} name={row.teamName} />
                  ({row.teamName})
                </span>
              </td>
              <td className="px-3 py-2 text-center">{row.played}</td>
              <td className="px-3 py-2 text-center">{row.won}</td>
              <td className="px-3 py-2 text-center">{row.drawn}</td>
              <td className="px-3 py-2 text-center">{row.lost}</td>
              <td className="px-3 py-2 text-center">{row.goalsFor}</td>
              <td className="px-3 py-2 text-center">{row.goalsAgainst}</td>
              <td className="px-3 py-2 text-center">{row.goalDifference}</td>
              <td className="px-3 py-2 text-center font-semibold">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
