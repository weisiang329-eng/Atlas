"use client";

/**
 * Trade ledger — the owner's book (docs/PORTFOLIO-ACCOUNTING.md).
 *
 * Two views, as institutional systems do it:
 *   总仓 (Position) — aggregate quantity, cost and average price
 *   按订单 (By lot)  — every buy tranche, what is left of it, and the realised
 *                      profit of each sell matched against it
 */
import { useState } from "react";
import { ChartContainer } from "@/components/chart/chart-container";
import { StatGrid } from "@/components/ui/stat-grid";
import { Badge } from "@/components/ui/badge";
import { TradeEntryForm } from "@/components/ledger/trade-entry-form";
import { useBook, type BookPosition } from "@/lib/loaders/use-book";
import { DataState } from "@/components/ui/data-state";
import { useT } from "@/lib/i18n/use-locale";
import { fmtChange, fmtDate, fmtNumber, toneClass } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Local alias so the call sites stay short; the formatting itself is shared. */
const num = (v: number, dp = 2) => fmtNumber(v, dp);

/**
 * A signed figure with its direction in the colour — the only place colour is
 * allowed to mean anything (DESIGN-SYSTEM §2). Sign, decimals and tone all come
 * from `lib/format`, so this reads identically to every other figure in Atlas.
 */
function Money({ v, dp = 2 }: { v: number; dp?: number }) {
  return (
    <span className={cn("num tabular-nums", toneClass(v))}>
      {fmtChange(v, dp, "")}
    </span>
  );
}

function PositionCard({ p, expanded, onToggle }: {
  p: BookPosition;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const closures = p.closures;
  const openLots = p.lots.filter((l) => l.remainingQty > 0);

  return (
    <div className="rounded-panel border border-border bg-surface shadow-panel">
      {/* 总仓 header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-fg">{p.symbol}</span>
            <Badge tone="neutral">{p.market}</Badge>
          </div>
          <span className="text-2xs text-faint">
            {openLots.length} {t("ledger.openLots")} · {closures.length} {t("ledger.closures")}
          </span>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="num text-sm text-fg">{num(p.quantity, 0)}</p>
          <p className="text-2xs text-faint">{t("ledger.qty")}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="num text-sm text-fg">{num(p.averagePrice, 4)}</p>
          <p className="text-2xs text-faint">{t("ledger.avgPrice")}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm"><Money v={p.realizedNetBase} /></p>
          <p className="text-2xs text-faint">{t("ledger.realizedNet")}</p>
        </div>
        <span aria-hidden className="shrink-0 text-faint">{expanded ? "−" : "+"}</span>
      </button>

      {/* 按订单 detail */}
      {expanded ? (
        <div className="border-t border-border bg-surface-3 px-4 py-3">
          <p className="mb-2 font-mono text-2xs uppercase tracking-[0.08em] text-faint">
            {t("ledger.byOrder")}
          </p>
          <ul className="flex flex-col gap-2">
            {p.lots.map((lot) => {
              const lotClosures = closures.filter((c) => c.lotId === lot.id);
              const soldQty = lotClosures.reduce((a, c) => a + c.quantity, 0);
              const lotNet = lotClosures.reduce((a, c) => a + c.netPlBase, 0);
              return (
                <li
                  key={lot.tradeId}
                  className="rounded border border-border-soft bg-surface p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone={lot.remainingQty > 0 ? "info" : "neutral"}>
                        {lot.remainingQty > 0 ? t("ledger.open") : t("ledger.closed")}
                      </Badge>
                      <span className="num text-sm text-fg">
                        {num(lot.originalQty, 0)} @ {num(lot.costPrice, 4)}
                      </span>
                      <span className="text-2xs text-faint">{fmtDate(lot.openedAt)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-2xs text-faint">
                      <span>{t("ledger.sold")} <span className="num text-fg">{num(soldQty, 0)}</span></span>
                      <span>{t("ledger.remaining")} <span className="num text-fg">{num(lot.remainingQty, 0)}</span></span>
                      {lotClosures.length > 0 ? (
                        <span>{t("ledger.net")} <Money v={lotNet} /></span>
                      ) : null}
                    </div>
                  </div>

                  {lotClosures.length > 0 ? (
                    <table className="mt-2 w-full text-2xs">
                      <thead>
                        <tr className="text-faint">
                          <th className="py-1 text-left font-mono font-medium uppercase tracking-[0.08em]">{t("ledger.date")}</th>
                          <th className="py-1 text-right font-mono font-medium uppercase tracking-[0.08em]">{t("ledger.qty")}</th>
                          <th className="py-1 text-right font-mono font-medium uppercase tracking-[0.08em]">{t("ledger.sellPrice")}</th>
                          <th className="py-1 text-right font-mono font-medium uppercase tracking-[0.08em]">{t("ledger.fees")}</th>
                          <th className="py-1 text-right font-mono font-medium uppercase tracking-[0.08em]">{t("ledger.pricePl")}</th>
                          <th className="py-1 text-right font-mono font-medium uppercase tracking-[0.08em]">{t("ledger.fxPl")}</th>
                          <th className="py-1 text-right font-mono font-medium uppercase tracking-[0.08em]">{t("ledger.netMyr")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lotClosures.map((c, i) => (
                          <tr key={`${c.sellTradeId}-${i}`} className="border-t border-border-soft">
                            <td className="py-1 text-muted">{fmtDate(c.closedAt)}</td>
                            <td className="num py-1 text-right text-fg">{num(c.quantity, 0)}</td>
                            <td className="num py-1 text-right text-fg">{num(c.sellPrice, 4)}</td>
                            <td className="num py-1 text-right text-muted">{num(c.feesLocal, 2)}</td>
                            <td className="py-1 text-right"><Money v={c.pricePlBase} /></td>
                            <td className="py-1 text-right"><Money v={c.fxPlBase} /></td>
                            <td className="py-1 text-right font-semibold"><Money v={c.netPlBase} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function LedgerWorkspace() {
  const t = useT();
  const { book, status, error, add, remove } = useBook();
  const { trades, positions, summary } = book;
  const [open, setOpen] = useState<string | null>(null);

  // Totals come from the server, which owns every calculation. The UI adds
  // nothing up itself — the same rule the rest of Atlas follows.
  const { costBasisBase, realizedNetBase, totalFeesBase, openPositions } =
    summary;

  return (
    <>
      <div className="mb-6">
        <StatGrid
          items={[
            { label: t("ledger.openPositions"), value: String(openPositions), hint: `${trades.length} ${t("ledger.trades")}` },
            { label: t("ledger.costBasis"), value: `RM ${num(costBasisBase, 0)}`, hint: t("ledger.atCost") },
            { label: t("ledger.realizedNet"), value: `RM ${num(realizedNetBase, 0)}`, hint: t("ledger.afterFees") },
            { label: t("ledger.totalFees"), value: `RM ${num(totalFeesBase, 0)}`, hint: t("ledger.allTime") },
          ]}
        />
      </div>

      <DataState status={status} error={error ?? undefined}>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ChartContainer title={t("ledger.positions")} subtitle={t("ledger.positionsSub")}>
          {positions.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">{t("ledger.empty")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {positions.map((p) => (
                <PositionCard
                  key={`${p.market}:${p.symbol}`}
                  p={p}
                  expanded={open === `${p.market}:${p.symbol}`}
                  onToggle={() =>
                    setOpen(open === `${p.market}:${p.symbol}` ? null : `${p.market}:${p.symbol}`)
                  }
                />
              ))}
            </div>
          )}
        </ChartContainer>

        <div className="flex flex-col gap-6">
          <ChartContainer title={t("ledger.addTrade")} subtitle={t("ledger.addTradeSub")}>
            <TradeEntryForm onAdd={add} />
          </ChartContainer>

          <ChartContainer title={t("ledger.recentTrades")} subtitle={`${trades.length}`}>
            {trades.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">{t("ledger.noTrades")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {[...trades]
                  .sort((a, b) => (a.tradedAt < b.tradedAt ? 1 : -1))
                  .slice(0, 10)
                  .map((tr) => (
                    <li key={tr.id} className="flex items-center gap-2 py-2">
                      <Badge tone={tr.side === "buy" ? "positive" : "warning"}>
                        {tr.side === "buy" ? t("ledger.buy") : t("ledger.sell")}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs text-fg">{tr.instrumentId.split(":")[1] ?? tr.instrumentId}</p>
                        <p className="num text-2xs text-faint">
                          {num(tr.quantity, 0)} @ {num(tr.price, 4)} · {fmtDate(tr.tradedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(tr.id)}
                        aria-label={t("ledger.delete")}
                        className="shrink-0 rounded px-2 py-1 text-2xs text-faint transition-colors hover:bg-surface-2 hover:text-negative"
                      >
                        ×
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </ChartContainer>
        </div>
      </div>
      </DataState>
    </>
  );
}
