import type { BeerDebt, Participant, Tournament } from "@/types";
import type { TournamentAwardWithMeta } from "@/lib/queries/awards";

export function ShareCard({
  tournament,
  awards,
  beerDebts,
  participants,
}: {
  tournament: Tournament;
  awards: TournamentAwardWithMeta[];
  beerDebts: BeerDebt[];
  participants: Participant[];
}) {
  const nameOf = (id: string | null): string => {
    const participant = participants.find((p) => p.userId === id);
    return participant
      ? `${participant.username} (${participant.teamName})`
      : "—";
  };

  const awardByCode = new Map(
    awards.map((award) => [award.award_definitions?.code, award]),
  );

  const champion = awardByCode.get("champion");
  const bota = awardByCode.get("bota_de_oro");
  const puskas = awardByCode.get("puskas");
  const beer = beerDebts[0];

  return (
    <div
      id="share-card"
      className="w-full max-w-sm overflow-hidden rounded-xl border border-leather-stitch/70 bg-leather-texture shadow-skeuo-card"
    >
      <div className="bg-gold-gradient px-5 py-4 text-center shadow-gold-plate">
        <p className="text-xs font-semibold uppercase tracking-widest text-leather-dark/70">
          Enchepaitos Tournament
        </p>
        <h3 className="text-xl font-bold text-leather-dark">{tournament.name}</h3>
        <p className="text-sm font-semibold text-leather-dark/80">
          {tournament.theme}
        </p>
      </div>

      <div className="space-y-3 px-5 py-4">
        <Row icon="🏆" label="Campeón" value={champion ? nameOf(champion.winner_id) : "—"} highlight />
        <Row icon="👞" label="Bota de Oro" value={bota ? nameOf(bota.winner_id) : "—"} />
        <Row icon="🥊" label="Premio Puskas" value={puskas ? nameOf(puskas.winner_id) : "—"} />
      </div>

      {beer && (
        <div className="border-t border-beer/30 bg-beer/10 px-5 py-3 text-center">
          <p className="text-sm font-semibold text-foam">
            🍺 {nameOf(beer.debtor_id)} invita a una jarra a{" "}
            {nameOf(beer.creditor_id)}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-chalk/60">
        <span aria-hidden>{icon}</span>
        {label}
      </span>
      <span
        className={
          highlight
            ? "text-sm font-bold text-metal-gold"
            : "text-sm font-semibold text-chalk"
        }
      >
        {value}
      </span>
    </div>
  );
}
