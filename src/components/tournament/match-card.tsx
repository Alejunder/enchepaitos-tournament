import { cn } from "@/lib/utils";
import type { Participant } from "@/types";

interface MatchCardProps {
  home: Participant | null;
  away: Participant | null;
  goalsP1: number | null;
  goalsP2: number | null;
  big?: boolean;
  media?: React.ReactNode;
}

export function MatchCard({
  home,
  away,
  goalsP1,
  goalsP2,
  big = false,
  media,
}: MatchCardProps) {
  const played = goalsP1 !== null && goalsP2 !== null;

  return (
    <div className="rounded-lg border border-leather-stitch/60 bg-chalkboard p-3 shadow-skeuo-inset">
      <div className="flex items-center justify-between gap-3">
        <TeamSide
          participant={home}
          score={goalsP1}
          align="right"
          winner={played && (goalsP1 as number) > (goalsP2 as number)}
          big={big}
        />
        <span className="shrink-0 text-xs uppercase tracking-widest text-chalk/40">
          vs
        </span>
        <TeamSide
          participant={away}
          score={goalsP2}
          align="left"
          winner={played && (goalsP2 as number) > (goalsP1 as number)}
          big={big}
        />
      </div>
      {media && (
        <div className="mt-3 border-t border-chalk/10 pt-3">{media}</div>
      )}
    </div>
  );
}

function TeamSide({
  participant,
  score,
  align,
  winner,
  big,
}: {
  participant: Participant | null;
  score: number | null;
  align: "left" | "right";
  winner: boolean;
  big: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col",
        align === "right" ? "items-end text-right" : "items-start text-left",
      )}
    >
      <span
        className={cn(
          big ? "text-lg font-bold" : "text-sm font-semibold",
          "text-chalk",
          winner && "text-led-text",
        )}
      >
        {participant ? participant.username : "—"}
      </span>
      <span className={cn(big ? "text-sm" : "text-xs", "text-chalk/50")}>
        {participant ? participant.teamName : "-"}
      </span>
      <span
        className={cn(
          big ? "mt-2 text-3xl font-bold" : "mt-1 text-lg font-bold",
          "tabular-nums",
          winner ? "text-led-text" : "text-chalk",
        )}
      >
        {score ?? "-"}
      </span>
    </div>
  );
}
