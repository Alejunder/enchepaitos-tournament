export interface GlobalRankingRow {
  userId: string;
  username: string;
  value: number;
}

export function GlobalRanking({
  rows,
  valueLabel,
  emptyText,
}: {
  rows: GlobalRankingRow[];
  valueLabel: string;
  emptyText: string;
}) {
  const filtered = rows.filter((row) => row.value > 0);

  if (filtered.length === 0) {
    return <p className="text-sm text-chalk/50">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-chalk/15 text-left text-xs uppercase tracking-wider text-chalk/50">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Jugador</th>
            <th className="px-3 py-2 text-center">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, index) => (
            <tr
              key={row.userId}
              className="border-b border-chalk/10 last:border-0"
            >
              <td className="px-3 py-2 text-chalk/50">{index + 1}</td>
              <td className="px-3 py-2 font-medium text-chalk">
                {row.username}
              </td>
              <td className="px-3 py-2 text-center font-semibold tabular-nums text-beer">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
