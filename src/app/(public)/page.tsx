import { TournamentStatusBadge } from "@/components/tournament/tournament-status-badge";
import { TournamentCover } from "@/components/tournament/tournament-cover";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaperPanel } from "@/components/ui/PaperPanel";
import { getCurrentProfile } from "@/lib/auth";
import { getCurrentTournament } from "@/lib/queries/tournaments";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [tournament, profile] = await Promise.all([
    getCurrentTournament(),
    getCurrentProfile(),
  ]);

  return (
    <div className="space-y-12">
      <section className="space-y-4 text-center">
        <h1 className="text-graffiti text-5xl font-bold text-leather-stitch sm:text-6xl">
          Enchepaitos
        </h1>
        <PaperPanel className="mx-auto max-w-md text-center">
          <p className="text-lg font-semibold tracking-wide text-ink">
            Torneo con lista limitada
          </p>
          <p className="mt-2 text-sm text-ink/70">
            Fútbol callejero · FL26 · Solo juega quien está en la lista.
          </p>
        </PaperPanel>
      </section>

      <section className="mx-auto max-w-xl">
        {tournament ? (
          <Card className="space-y-4">
            <TournamentCover
              src={tournament.cover_image_url}
              alt={tournament.theme}
              className="aspect-[16/6] w-full rounded-lg"
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-graffiti text-2xl font-bold text-chalk">
                  {tournament.name}
                </h2>
                <p className="mt-1 text-xl font-bold text-beer">
                  📅 {formatDateTime(tournament.starts_at)}
                </p>
              </div>
              <TournamentStatusBadge status={tournament.status} />
            </div>

            <p className="text-sm text-chalk/60">
              {tournament.participantCount} en la lista
            </p>

            <div>
              <LinkButton
                href={`/torneos/${tournament.id}`}
                variant="secondary"
                size="md"
              >
                Ver torneo
              </LinkButton>
            </div>
          </Card>
        ) : (
          <Card className="text-center">
            <p className="text-graffiti text-xl font-bold text-chalk">
              Sin torneo en marcha
            </p>
            <p className="mt-2 text-sm text-chalk/60">
              Vuelve pronto. La próxima edición se está montando.
            </p>
          </Card>
        )}
      </section>

      {!profile && (
        <section className="mx-auto max-w-xl text-center">
          <PaperPanel className="text-center">
            <h2 className="text-graffiti text-xl font-bold text-ink">
              ¿De qué va esto?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">
              Un torneo privado de fútbol callejero. Pides hueco, el admin te da
              el visto bueno, eliges tu equipo de FL26 y a jugar. Si ganas, te
              llevas la pasta de todos; si te meten más goles, invitas a una
              jarra.
            </p>
            <div className="mt-5">
              <LinkButton href="/register" size="lg">
                Pedir hueco
              </LinkButton>
            </div>
          </PaperPanel>
        </section>
      )}
    </div>
  );
}
