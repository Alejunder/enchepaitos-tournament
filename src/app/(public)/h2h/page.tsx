import { H2HSummaryView } from "@/components/stats/h2h-summary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaperPanel } from "@/components/ui/PaperPanel";
import { getH2HSummary, listPlayers } from "@/lib/queries/h2h";

export const dynamic = "force-dynamic";

const SELECT_CLASS =
  "h-10 rounded-lg border border-leather-stitch/50 bg-black/40 px-3 text-sm text-chalk shadow-skeuo-inset focus:border-beer focus:outline-none focus:ring-2 focus:ring-beer/30";

export default async function H2HPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const players = await listPlayers();

  const nameById = new Map(players.map((player) => [player.id, player.username]));

  let summary = null;
  if (a && b && a !== b) {
    summary = await getH2HSummary(a, b);
  }

  return (
    <div className="space-y-6">
      <PaperPanel>
        <h1 className="text-graffiti text-2xl font-bold text-ink">
          Cara a cara
        </h1>
        <p className="mt-1 text-sm text-ink/75">
          Historial de enfrentamientos entre dos jugadores.
        </p>
      </PaperPanel>

      <Card>
        <form method="GET" action="/h2h" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-chalk/60">
                Jugador A
              </span>
              <select name="a" defaultValue={a} required className={SELECT_CLASS}>
                <option value="" disabled className="bg-leather-dark">
                  Selecciona…
                </option>
                {players.map((player) => (
                  <option key={player.id} value={player.id} className="bg-leather-dark">
                    {player.username}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-chalk/60">
                Jugador B
              </span>
              <select name="b" defaultValue={b} required className={SELECT_CLASS}>
                <option value="" disabled className="bg-leather-dark">
                  Selecciona…
                </option>
                {players.map((player) => (
                  <option key={player.id} value={player.id} className="bg-leather-dark">
                    {player.username}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Button type="submit" size="sm">
            Comparar
          </Button>
        </form>
      </Card>

      {a && b && a === b && (
        <PaperPanel>
          <p className="text-sm text-ink">
            Elige dos jugadores distintos para comparar.
          </p>
        </PaperPanel>
      )}

      {summary && a && b && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-chalk">
            {nameById.get(a) ?? "A"} vs {nameById.get(b) ?? "B"}
          </h2>
          <H2HSummaryView
            summary={summary}
            nameA={nameById.get(a) ?? "A"}
            nameB={nameById.get(b) ?? "B"}
          />
        </Card>
      )}
    </div>
  );
}
