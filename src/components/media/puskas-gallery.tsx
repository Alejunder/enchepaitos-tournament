import { DeleteNominationButton } from "@/components/media/delete-nomination-button";
import { PuskasVoteButton } from "@/components/media/puskas-vote-button";
import type { PuskasNominationWithMeta, PuskasVoteRow } from "@/lib/queries/awards";

export function PuskasGallery({
  nominations,
  votes,
  currentUserId,
  canVote,
  isAdmin = false,
}: {
  nominations: PuskasNominationWithMeta[];
  votes: PuskasVoteRow[];
  currentUserId: string | undefined;
  canVote: boolean;
  isAdmin?: boolean;
}) {
  if (nominations.length === 0) {
    return (
      <p className="text-sm text-chalk/50">Aún no hay goles nominados.</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {nominations.map((nomination) => {
        const voteCount = votes.filter(
          (vote) => vote.nomination_id === nomination.id,
        ).length;
        const alreadyVoted = votes.some(
          (vote) => vote.voter_id === currentUserId,
        );

        return (
          <div
            key={nomination.id}
            className="overflow-hidden rounded-lg border border-leather-stitch/60 bg-black/40 shadow-skeuo-card"
          >
            <video
              src={nomination.video_url}
              controls
              preload="metadata"
              className="aspect-video w-full bg-black"
            />
            <div className="flex items-center justify-between gap-3 p-3">
              <p className="truncate text-sm font-medium text-chalk">
                {nomination.username}
              </p>
              <div className="flex items-center gap-1">
                <PuskasVoteButton
                  nominationId={nomination.id}
                  tournamentId={nomination.tournament_id}
                  votes={voteCount}
                  alreadyVoted={alreadyVoted}
                  canVote={canVote}
                />
                {isAdmin && (
                  <DeleteNominationButton
                    nominationId={nomination.id}
                    tournamentId={nomination.tournament_id}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
