import { formatDate } from "@/lib/utils";
import type { H2HSummary } from "@/types";

export function H2HSummaryView({
  summary,
  nameA,
  nameB,
}: {
  summary: H2HSummary;
  nameA: string;
  nameB: string;
}) {
  if (summary.matchesPlayed === 0) {
    return (
      <p className="text-sm text-chalk/50">
        Estos dos jugadores aún no se han enfrentado.
      </p>
    );
  }

  const stats = [
    { label: "Partidos", value: summary.matchesPlayed },
    { label: `Victorias ${nameA}`, value: summary.winsPlayerA },
    { label: "Empates", value: summary.draws },
    { label: `Victorias ${nameB}`, value: summary.winsPlayerB },
    { label: `Goles ${nameA}`, value: summary.goalsPlayerA },
    { label: `Goles ${nameB}`, value: summary.goalsPlayerB },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-leather-stitch/50 bg-black/30 p-3 text-center shadow-skeuo-inset"
          >
            <p className="text-2xl font-bold text-chalk tabular-nums">
              {stat.value}
            </p>
            <p className="text-xs uppercase tracking-wide text-chalk/50">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-chalk/50">
          Historial
        </h3>
        {summary.history.map((record, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-leather-stitch/40 bg-black/20 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-chalk">
                {record.tournamentName}
              </p>
              <p className="truncate text-xs text-beer">{record.tournamentTheme}</p>
              <p className="truncate text-xs text-chalk/50">
                {record.player1Team} · {record.player2Team} ·{" "}
                {formatDate(record.date)}
              </p>
            </div>
            <span className="text-lg font-bold text-chalk tabular-nums">
              {record.goalsP1} - {record.goalsP2}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
