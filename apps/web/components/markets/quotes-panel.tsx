"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/data/data-table";
import { ChartContainer } from "@/components/chart/chart-container";
import { IntradayChart } from "@/components/chart/intraday-chart";
import { Candlestick } from "@/components/chart/candlestick";
import { Sparkline } from "@/components/chart/sparkline";
import { Badge } from "@/components/ui/badge";
import { PriceCell, ChangeCell } from "@/components/markets/price-cell";
import {
  MOCK_QUOTES,
  MOCK_SUBJECT_NOTE,
  mockCandles,
  mockIntraday,
  mockSparkline,
  type MockQuote,
} from "@/lib/mock/markets";
import { formatRelative } from "@/lib/format";

interface LiveQuote extends MockQuote {
  changePct: number;
  asOf: number;
}

function toLive(q: MockQuote, asOf: number): LiveQuote {
  return { ...q, changePct: ((q.price - q.prevClose) / q.prevClose) * 100, asOf };
}

/**
 * Client-side quote simulator standing in for the P027 15s-polling loader
 * (`GET /v1/markets/quotes`). Swap this effect for a real `apiFetch` poll when
 * the quote-feed adapter lands — the rest of the tree (table, flash, charts)
 * is already the production shape.
 */
function useSimulatedQuotes(initial: MockQuote[]) {
  const [quotes, setQuotes] = useState<LiveQuote[]>(() =>
    initial.map((q) => toLive(q, Date.now())),
  );

  useEffect(() => {
    const iv = setInterval(() => {
      setQuotes((prev) =>
        prev.map((q) => {
          const r = Math.random() - 0.5;
          if (Math.abs(r) < 0.18) return q; // most ticks: no move (quiet market)
          const dir = r > 0 ? 1 : -1;
          const price = Math.max(0.01, q.price * (1 + dir * Math.random() * 0.003));
          return { ...q, price, changePct: ((price - q.prevClose) / q.prevClose) * 100, asOf: Date.now() };
        }),
      );
    }, 1500);
    return () => clearInterval(iv);
  }, []);

  return quotes;
}

export function QuotesPanel() {
  const quotes = useSimulatedQuotes(MOCK_QUOTES);
  const [selected, setSelected] = useState(quotes[0]?.ticker ?? "");
  const active = quotes.find((q) => q.ticker === selected) ?? quotes[0];

  const intraday = useMemo(
    () => (active ? mockIntraday(active.prevClose, active.ticker.length + active.prevClose) : []),
    [active?.ticker],
  );
  const candles = useMemo(
    () => (active ? mockCandles(active.prevClose, active.ticker.length + 3) : []),
    [active?.ticker],
  );

  const columns: Column<LiveQuote>[] = [
    {
      key: "ticker",
      header: "代码 Ticker",
      sortable: true,
      render: (q) => (
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-sm font-semibold text-fg">{q.ticker}</span>
          <span className="truncate text-2xs text-faint">{q.name}</span>
        </div>
      ),
    },
    {
      key: "sector",
      header: "行业 Sector",
      sortable: true,
      className: "text-muted",
    },
    {
      key: "spark",
      header: "趋势",
      align: "center",
      render: (q) => (
        <Sparkline values={mockSparkline(q.ticker, q.changePct >= 0)} width={72} height={22} ariaLabel={`${q.ticker} trend`} />
      ),
    },
    {
      key: "price",
      header: "现价 Price",
      numeric: true,
      sortable: true,
      sortAccessor: (q) => q.price,
      render: (q) => <PriceCell value={q.price} currency={q.currency} />,
    },
    {
      key: "changePct",
      header: "涨跌 Chg%",
      numeric: true,
      sortable: true,
      sortAccessor: (q) => q.changePct,
      render: (q) => <ChangeCell value={q.changePct} />,
    },
    {
      key: "asOf",
      header: "更新 Updated",
      numeric: true,
      className: "text-faint",
      render: (q) => (q.delaySec > 0 ? `延迟 ${Math.round(q.delaySec / 60)} 分钟` : formatRelative(q.asOf)),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Badge tone="warning">Mock</Badge>
        <span className="text-2xs text-faint">{MOCK_SUBJECT_NOTE}</span>
      </div>

      <div className="rounded-panel border border-border bg-surface shadow-panel">
        <DataTable
        mobileCards
        columnPickerId="quotes"
          columns={columns}
          rows={quotes}
          getRowId={(q) => q.ticker}
          searchable
          searchPlaceholder="Search watchlist…"
          onRowClick={(q) => setSelected(q.ticker)}
          caption="Watchlist quotes"
        />
      </div>

      {active ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartContainer
            title={`${active.ticker} · 分时 Intraday`}
            subtitle={`${active.name} · vs prev close ${active.prevClose.toFixed(2)}`}
            height={200}
          >
            <IntradayChart data={intraday} prevClose={active.prevClose} height={200} ariaLabel={`${active.ticker} intraday`} />
          </ChartContainer>
          <ChartContainer title={`${active.ticker} · 日 K Daily`} subtitle="60 sessions (mock)" height={200}>
            <Candlestick data={candles} height={200} ariaLabel={`${active.ticker} candlestick`} />
          </ChartContainer>
        </div>
      ) : null}
    </div>
  );
}
