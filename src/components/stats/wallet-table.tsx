import { cn, formatEuro } from "@/lib/utils";
import type { FinancialRow } from "@/lib/queries/financials";

const RANK_STYLES = [
  "bg-gold-gradient text-leather-dark shadow-gold-plate",
  "bg-silver-gradient text-leather-dark",
  "bg-gradient-to-b from-amber-600 to-amber-800 text-white",
];

export function WalletTable({ rows }: { rows: FinancialRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-chalk/50">
        Aún no hay torneos finalizados, la billetera se calculará al cerrarse.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-leather-stitch/50 text-left text-xs uppercase tracking-wide text-chalk/50">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Usuario</th>
            <th className="px-3 py-2 text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.user_id}
              className="border-b border-leather-stitch/20 last:border-0"
            >
              <td className="px-3 py-2">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    RANK_STYLES[index] ?? "bg-black/40 text-chalk/60",
                  )}
                >
                  {index + 1}
                </span>
              </td>
              <td className="px-3 py-2 font-medium text-chalk">
                {row.username}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right font-semibold tabular-nums",
                  row.net_balance_eur > 0
                    ? "text-led-text"
                    : row.net_balance_eur < 0
                      ? "text-red-400"
                      : "text-chalk/60",
                )}
              >
                {row.net_balance_eur > 0 ? "+" : ""}
                {formatEuro(row.net_balance_eur)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
