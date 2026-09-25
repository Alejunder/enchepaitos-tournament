import { LeatherCard } from "@/components/ui/LeatherCard";
import type { BeerDebt, Participant } from "@/types";
import type { TournamentAwardWithMeta } from "@/lib/queries/awards";

export function AwardsPanel({
  awards,
  beerDebts,
  participants,
  finished,
}: {
  awards: TournamentAwardWithMeta[];
  beerDebts: BeerDebt[];
  participants: Participant[];
  finished: boolean;
}) {
  const labelById = new Map(
    participants.map((participant) => [
      participant.userId,
      `${participant.username} (${participant.teamName})`,
    ]),
  );

  if (awards.length === 0 && !finished) {
    return (
      <p className="text-sm text-chalk/50">
        Los premios se reparten automáticamente al cerrar el torneo.
      </p>
    );
  }

  if (awards.length === 0) {
    return <p className="text-sm text-chalk/50">Sin premios asignados.</p>;
  }

  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {awards.map((award) => (
          <li
            key={award.id}
            className="flex items-center gap-3 rounded-lg border border-leather-stitch/60 bg-black/30 p-3 shadow-skeuo-inset"
          >
            <span className="text-2xl" aria-hidden>
              {award.award_definitions?.icon ?? "🏆"}
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-beer">
                {award.award_definitions?.name ?? "Premio"}
              </p>
              <p className="truncate text-sm font-semibold text-chalk">
                {labelById.get(award.winner_id) ?? "—"}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {beerDebts.length > 0 && (
        <LeatherCard className="border-beer/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-beer">
            🍺 Cervezómetro
          </p>
          {beerDebts.map((debt) => (
            <p key={debt.id} className="mt-1 text-sm text-chalk/90">
              <strong className="text-foam">
                {labelById.get(debt.debtor_id) ?? "—"}
              </strong>{" "}
              invita a una jarra a{" "}
              <strong className="text-foam">
                {labelById.get(debt.creditor_id) ?? "—"}
              </strong>
            </p>
          ))}
        </LeatherCard>
      )}
    </div>
  );
}
