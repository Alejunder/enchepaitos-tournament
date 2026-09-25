import { PaperPanel } from "@/components/ui/PaperPanel";
import { tieAggregate, tieWinner } from "@/lib/knockout";
import { cn } from "@/lib/utils";
import type { Match, MatchPhase, Participant } from "@/types";

const PHASE_LABEL: Record<MatchPhase, string> = {
  group: "Grupos",
  playin: "Sub-eliminatoria",
  round16: "Octavos",
  quarter: "Cuartos",
  semi: "Semifinales",
  final: "Final",
};

const MAIN_ORDER: MatchPhase[] = ["round16", "quarter", "semi", "final"];

const NODE_W = 250;
const COL_GAP = 56;
const COL_W = NODE_W + COL_GAP;
const NODE_H = 132;
const UNIT = 200;

function BracketNode({
  tie,
  label,
}: {
  tie: Match[];
  label: (id: string | null) => string;
}) {
  const sorted = [...tie].sort((a, b) => (a.leg ?? 0) - (b.leg ?? 0));
  const first = sorted[0];
  const homeId = first.player1_id;
  const awayId = first.player2_id;

  const winner = tieWinner(sorted);
  const twoLegs = sorted.length > 1;

  const { playerA, aggA, aggB } = tieAggregate(sorted);

  const decider = sorted.find((m) => m.leg === 2) ?? sorted[0];
  const hasPen =
    !!decider &&
    decider.penalties_p1 !== null &&
    decider.penalties_p2 !== null;

  const scoreText = (m: Match) => {
    if (!m.played) return "vs";
    // Normaliza a "A vs B" (playerA es el local de la ida).
    return m.player1_id === playerA
      ? `${m.goals_p1} - ${m.goals_p2}`
      : `${m.goals_p2} - ${m.goals_p1}`;
  };

  return (
    <div
      className="rounded-lg border border-leather-stitch/60 bg-chalkboard p-2 text-center shadow-skeuo-inset"
      style={{ width: NODE_W }}
    >
      <p
        className={cn(
          "truncate text-sm font-semibold",
          winner && winner === homeId ? "text-led-text" : "text-chalk",
        )}
      >
        {label(homeId)}
      </p>

      {twoLegs ? (
        <div className="my-1 space-y-0.5 text-xs text-chalk/80">
          <p className="tabular-nums">
            Ida {scoreText(sorted[0])} · Vuelta {scoreText(sorted[1])}
          </p>
          <p className="font-bold tabular-nums text-beer">
            Global {aggA} - {aggB}
          </p>
        </div>
      ) : (
        <p className="my-1 text-sm font-bold tabular-nums text-beer">
          {scoreText(first)}
        </p>
      )}

      {hasPen && decider && (
        <p className="text-xs tabular-nums text-beer">
          Penaltis {decider.penalties_p1} - {decider.penalties_p2}
        </p>
      )}

      <p
        className={cn(
          "truncate text-sm font-semibold",
          winner && winner === awayId ? "text-led-text" : "text-chalk",
        )}
      >
        {label(awayId)}
      </p>
    </div>
  );
}

export function KnockoutBracket({
  matches,
  participants,
}: {
  matches: Match[];
  participants: Participant[];
}) {
  if (matches.length === 0) {
    return null;
  }

  const byId = new Map(participants.map((p) => [p.userId, p]));
  const label = (id: string | null) => {
    const p = id ? byId.get(id) : null;
    return p ? `${p.username} (${p.teamName})` : "—";
  };

  const tiesByPhase = new Map<string, Map<number, Match[]>>();
  for (const match of matches) {
    let phaseMap = tiesByPhase.get(match.phase);
    if (!phaseMap) {
      phaseMap = new Map();
      tiesByPhase.set(match.phase, phaseMap);
    }
    const slot = match.bracket_slot ?? 0;
    const tie = phaseMap.get(slot) ?? [];
    tie.push(match);
    phaseMap.set(slot, tie);
  }

  const tiesOf = (phase: MatchPhase): Match[][] => {
    const phaseMap = tiesByPhase.get(phase);
    if (!phaseMap) return [];
    return [...phaseMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, tie]) => tie);
  };

  const playIns = tiesOf("playin");
  const rounds = MAIN_ORDER.filter((phase) => tiesOf(phase).length > 0);

  const firstCount = rounds.length > 0 ? tiesOf(rounds[0]).length : 0;
  const totalHeight = firstCount > 1 ? firstCount * UNIT : NODE_H * 2;
  const baseColumn = playIns.length > 0 ? 1 : 0;

  const centerY = (count: number, index: number) =>
    (index + 0.5) * (totalHeight / count);

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="relative"
        style={{
          height: totalHeight,
          minWidth: (baseColumn + rounds.length) * COL_W,
        }}
      >
        {playIns.length > 0 && (
          <div
            className="absolute top-0 flex h-full flex-col justify-around"
            style={{ left: 0, width: NODE_W }}
          >
            <PaperPanel className="mb-2 self-start px-3 py-1">
              <h3 className="text-graffiti text-xs font-bold text-ink">
                {PHASE_LABEL.playin}
              </h3>
            </PaperPanel>
            {playIns.map((tie) => (
              <BracketNode key={tie[0].id} tie={tie} label={label} />
            ))}
          </div>
        )}

        {rounds.map((phase, ri) => {
          const ties = tiesOf(phase);
          const count = ties.length;
          const left = (baseColumn + ri) * COL_W;
          const isLast = ri === rounds.length - 1;

          return (
            <div
              key={phase}
              className="absolute top-0"
              style={{ left, width: COL_W, height: totalHeight }}
            >
              <PaperPanel className="mb-2 self-start px-3 py-1">
                <h3 className="text-graffiti text-xs font-bold text-ink">
                  {PHASE_LABEL[phase]}
                </h3>
              </PaperPanel>

              {ties.map((tie, mi) => {
                const cy = centerY(count, mi);

                return (
                  <div
                    key={tie[0].id}
                    className="absolute"
                    style={{ top: cy - NODE_H / 2, left: 0 }}
                  >
                    <BracketNode tie={tie} label={label} />

                    {!isLast && (
                      <>
                        <span
                          className="absolute bg-[#a98b5f]"
                          style={{
                            top: NODE_H / 2 - 1,
                            left: NODE_W,
                            width: COL_GAP / 2,
                            height: 2,
                          }}
                        />
                        {mi % 2 === 0 && (
                          <span
                            className="absolute bg-[#a98b5f]"
                            style={{
                              top: NODE_H / 2,
                              left: NODE_W + COL_GAP / 2 - 1,
                              width: 2,
                              height: totalHeight / count,
                            }}
                          />
                        )}
                        <span
                          className="absolute bg-[#a98b5f]"
                          style={{
                            top:
                              NODE_H / 2 +
                              (mi % 2 === 0
                                ? totalHeight / count / 2
                                : -totalHeight / count / 2) -
                              1,
                            left: NODE_W + COL_GAP / 2,
                            width: COL_GAP / 2,
                            height: 2,
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
