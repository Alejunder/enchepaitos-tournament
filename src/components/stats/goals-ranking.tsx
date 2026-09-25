import type { StandingRow } from "@/types";

export function GoalsRanking({
  standings,
  metric,
}: {
  standings: StandingRow[];
  metric: "goalsFor" | "goalsAgainst";
}) {
  const rows = [...standings]
    .filter((row) => row[metric] > 0)
    .sort(
      (a, b) =>
        b[metric] - a[metric] ||
        b.goalDifference - a.goalDifference ||
        a.username.localeCompare(b.username),
    );

  if (rows.length === 0) {
    return <p className="text-sm text-chalk/50">Aún no hay goles registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-chalk/15 text-left text-xs uppercase tracking-wider text-chalk/50">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Jugador (Equipo)</th>
            <th className="px-3 py-2 text-center">Goles</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.userId}
              className="border-b border-chalk/10 last:border-0"
            >
              <td className="px-3 py-2 text-chalk/50">{index + 1}</td>
              <td className="px-3 py-2 font-medium text-chalk">
                {row.username}{" "}
                <span className="text-chalk/50">({row.teamName})</span>
              </td>
              <td className="px-3 py-2 text-center font-semibold tabular-nums text-beer">
                {row[metric]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
