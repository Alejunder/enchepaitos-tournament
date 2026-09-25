import type { PuskasNominationWithMeta, PuskasVoteRow } from "@/lib/queries/awards";

export function PuskasRanking({
  nominations,
  votes,
}: {
  nominations: PuskasNominationWithMeta[];
  votes: PuskasVoteRow[];
}) {
  if (nominations.length === 0) {
    return (
      <p className="text-sm text-chalk/50">Aún no hay goles nominados.</p>
    );
  }

  const ranked = nominations
    .map((nomination) => ({
      ...nomination,
      votes: votes.filter((v) => v.nomination_id === nomination.id).length,
    }))
    .sort(
      (a, b) =>
        b.votes - a.votes ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  return (
    <ol className="space-y-2">
      {ranked.map((nomination, index) => (
        <li
          key={nomination.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-leather-stitch/50 bg-black/30 px-4 py-2"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/40 text-xs font-bold text-chalk/70">
              {index + 1}
            </span>
            <span className="truncate font-medium text-chalk">
              {nomination.username}
            </span>
          </span>
          <span className="shrink-0 text-sm font-bold text-beer tabular-nums">
            {nomination.votes}{" "}
            {nomination.votes === 1 ? "voto" : "votos"}
          </span>
        </li>
      ))}
    </ol>
  );
}
