import { GlobalRanking } from "@/components/stats/global-ranking";
import { WalletTable } from "@/components/stats/wallet-table";
import { ChalkboardPanel } from "@/components/tournament/ChalkboardPanel";
import { PaperPanel } from "@/components/ui/PaperPanel";
import { getUserFinancials } from "@/lib/queries/financials";
import { getGlobalPuskas, getGlobalScorers } from "@/lib/queries/global-stats";

export const dynamic = "force-dynamic";

export default async function RankingsPage() {
  const [financials, scorers, puskas] = await Promise.all([
    getUserFinancials(),
    getGlobalScorers(),
    getGlobalPuskas(),
  ]);

  const botaDeOro = [...scorers]
    .sort(
      (a, b) => b.goalsFor - a.goalsFor || a.username.localeCompare(b.username),
    )
    .map((row) => ({
      userId: row.userId,
      username: row.username,
      value: row.goalsFor,
    }));

  const sacoDeGoles = [...scorers]
    .sort(
      (a, b) =>
        b.goalsAgainst - a.goalsAgainst || a.username.localeCompare(b.username),
    )
    .map((row) => ({
      userId: row.userId,
      username: row.username,
      value: row.goalsAgainst,
    }));

  const premioPuskas = [...puskas]
    .sort((a, b) => b.votes - a.votes || a.username.localeCompare(b.username))
    .map((row) => ({
      userId: row.userId,
      username: row.username,
      value: row.votes,
    }));

  return (
    <div className="space-y-6">
      <PaperPanel>
        <h1 className="text-graffiti text-2xl font-bold text-ink">
          Rankings
        </h1>
        <p className="mt-1 text-sm text-ink/75">
          Clasificaciones globales de Enchepaitos Tournament.
        </p>
      </PaperPanel>

      <ChalkboardPanel title="Billetera (€)">
        <WalletTable rows={financials} />
      </ChalkboardPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChalkboardPanel title="Bota de Oro · Goleadores">
          <GlobalRanking
            rows={botaDeOro}
            valueLabel="Goles"
            emptyText="Aún no hay goles registrados."
          />
        </ChalkboardPanel>

        <ChalkboardPanel title="Al que más se la meten · Más goleados">
          <GlobalRanking
            rows={sacoDeGoles}
            valueLabel="Goles"
            emptyText="Aún no hay goles registrados."
          />
        </ChalkboardPanel>
      </div>

      <ChalkboardPanel title="Premio Puskas · Votaciones">
        <GlobalRanking
          rows={premioPuskas}
          valueLabel="Votos"
          emptyText="Aún no hay votos registrados."
        />
      </ChalkboardPanel>
    </div>
  );
}
