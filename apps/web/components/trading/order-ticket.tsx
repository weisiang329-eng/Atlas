"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { MOCK_QUOTES } from "@/lib/mock/markets";
import { RISK_RULES } from "@/lib/mock/trading";

interface Draft {
  ticker: string;
  side: "buy" | "sell";
  qty: number;
  type: "market" | "limit";
  limitPrice: number;
}

/**
 * Order Ticket — P028 v1, PAPER mode only. Hard rule (written into the
 * component, not just the doc): nothing sends until the user clicks
 * "确认送出" on the confirmation step. There is no path that skips it.
 */
export function OrderTicket() {
  const [draft, setDraft] = useState<Draft>({ ticker: "HLXC", side: "buy", qty: 100, type: "market", limitPrice: 0 });
  const [stage, setStage] = useState<"editing" | "confirming" | "sent">("editing");

  const quote = MOCK_QUOTES.find((q) => q.ticker === draft.ticker)!;
  const refPrice = draft.type === "limit" && draft.limitPrice > 0 ? draft.limitPrice : quote.price;
  const estValue = refPrice * draft.qty;

  const violations = useMemo(() => {
    const v: string[] = [];
    if (!RISK_RULES.tickerAllowlist.includes(draft.ticker)) v.push("该标的不在可交易白名单（可能仅出信号，不可下单）");
    if (estValue > RISK_RULES.maxOrderValue) v.push(`预估金额超过单笔上限 ${formatCurrency(RISK_RULES.maxOrderValue)}`);
    return v;
  }, [draft, estValue]);

  if (stage === "sent") {
    return (
      <div className="rounded-panel border border-border bg-surface p-5 text-center shadow-panel">
        <Badge tone="positive">已送出（Paper）</Badge>
        <p className="mt-3 text-sm text-muted">
          {draft.side === "buy" ? "买入" : "卖出"} {draft.qty} 股 {draft.ticker} · 预估 {formatCurrency(estValue)}
        </p>
        <button
          type="button"
          onClick={() => setStage("editing")}
          className="mt-4 rounded border border-border px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2"
        >
          新建下一单
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-panel border border-border bg-surface p-5 shadow-panel">
      <div className="flex items-center gap-2">
        <Badge tone="info">PAPER</Badge>
        <span className="text-2xs text-faint">纸上交易 — 不连接真实券商账户</span>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-2xs uppercase tracking-wide text-faint">品种</span>
        <select
          value={draft.ticker}
          onChange={(e) => setDraft((d) => ({ ...d, ticker: e.target.value }))}
          disabled={stage === "confirming"}
          className="rounded border border-border bg-bg px-2.5 py-1.5 text-fg"
        >
          {MOCK_QUOTES.map((q) => (
            <option key={q.ticker} value={q.ticker}>
              {q.ticker} · {q.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex rounded border border-border p-0.5">
          {(["buy", "sell"] as const).map((s) => (
            <button
              key={s}
              type="button"
              disabled={stage === "confirming"}
              onClick={() => setDraft((d) => ({ ...d, side: s }))}
              className={`flex-1 rounded px-2 py-1.5 text-sm transition-colors ${draft.side === s ? (s === "buy" ? "bg-positive/20 text-positive" : "bg-negative/20 text-negative") : "text-faint"}`}
            >
              {s === "buy" ? "买入" : "卖出"}
            </button>
          ))}
        </div>
        <div className="flex rounded border border-border p-0.5">
          {(["market", "limit"] as const).map((t) => (
            <button
              key={t}
              type="button"
              disabled={stage === "confirming"}
              onClick={() => setDraft((d) => ({ ...d, type: t }))}
              className={`flex-1 rounded px-2 py-1.5 text-sm transition-colors ${draft.type === t ? "bg-surface-2 text-fg" : "text-faint"}`}
            >
              {t === "market" ? "市价" : "限价"}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-2xs uppercase tracking-wide text-faint">数量</span>
        <input
          type="number"
          min={1}
          value={draft.qty}
          disabled={stage === "confirming"}
          onChange={(e) => setDraft((d) => ({ ...d, qty: Math.max(1, Number(e.target.value)) }))}
          className="num rounded border border-border bg-bg px-2.5 py-1.5 text-fg"
        />
      </label>

      {draft.type === "limit" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-2xs uppercase tracking-wide text-faint">限价</span>
          <input
            type="number"
            step="0.01"
            value={draft.limitPrice || quote.price}
            disabled={stage === "confirming"}
            onChange={(e) => setDraft((d) => ({ ...d, limitPrice: Number(e.target.value) }))}
            className="num rounded border border-border bg-bg px-2.5 py-1.5 text-fg"
          />
        </label>
      ) : null}

      <div className="flex items-center justify-between rounded border border-border-soft bg-surface-3 px-3 py-2 text-sm">
        <span className="text-muted">预估金额</span>
        <span className="num font-medium text-fg">{formatCurrency(estValue, quote.currency)}</span>
      </div>

      {violations.length > 0 ? (
        <ul className="flex flex-col gap-1 rounded border border-negative/40 bg-negative/10 px-3 py-2 text-sm text-negative">
          {violations.map((v, i) => (
            <li key={i}>⚠ {v}</li>
          ))}
        </ul>
      ) : null}

      {stage === "editing" ? (
        <button
          type="button"
          disabled={violations.length > 0}
          onClick={() => setStage("confirming")}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          审核订单
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded border border-accent-dim bg-accent/10 p-3">
          <p className="text-sm text-fg">
            确认{draft.side === "buy" ? "买入" : "卖出"} <b>{draft.qty}</b> 股 <b>{draft.ticker}</b>
            {draft.type === "limit" ? ` @ 限价 ${draft.limitPrice || quote.price}` : "（市价）"}？
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStage("sent")}
              className="rounded bg-accent px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              确认送出
            </button>
            <button
              type="button"
              onClick={() => setStage("editing")}
              className="rounded border border-border px-4 py-2 text-sm text-fg transition-colors hover:bg-surface-2"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
