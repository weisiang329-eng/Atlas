"use client";

/**
 * Agent Console — the research department, and the controls over it.
 *
 * Console design ported from the Hookka ERP agent console, which had already
 * solved the governance problem: an agent that can act needs a visible
 * history, a pause switch and an explicit autonomy level, or the owner cannot
 * answer "what did it do, and can I stop it".
 *
 * Each analyst card shows both halves: its MANDATE (what it owns, what it must
 * never do) and its STATE (paused, autonomy phase, last run). Mandate is on
 * the card rather than buried in a doc because the boundaries are the product
 * — an analyst that strays outside them is the failure mode to watch for.
 */
import { useState } from "react";
import { ChartContainer } from "@/components/chart/chart-container";
import { StatGrid } from "@/components/ui/stat-grid";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";
import {
  useAnalysts,
  type Analyst,
  type AnalystId,
} from "@/lib/loaders/use-analysts";
import { useLocale } from "@/lib/i18n/use-locale";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

/** 1 propose · 2 auto-tune · 3 full-auto — autonomy is granted, never assumed. */
const PHASES = [
  { value: 1, labelZh: "提议", labelEn: "Propose" },
  { value: 2, labelZh: "半自动", labelEn: "Auto-tune" },
  { value: 3, labelZh: "全自动", labelEn: "Full-auto" },
];

/** Traffic light: paused beats stale beats failed beats healthy. */
function lightOf(a: Analyst, killSwitch: boolean) {
  if (killSwitch || a.paused) return { tone: "neutral" as const, dot: "bg-faint" };
  if (a.lastRun?.status === "error")
    return { tone: "negative" as const, dot: "bg-negative" };
  if (!a.lastRun) return { tone: "neutral" as const, dot: "bg-border-strong" };
  return { tone: "positive" as const, dot: "bg-positive" };
}

function AnalystCard({
  a,
  killSwitch,
  onControl,
  onRun,
}: {
  a: Analyst;
  killSwitch: boolean;
  onControl: (patch: { paused?: boolean; phase?: number }) => Promise<void>;
  onRun: (q: string) => Promise<void>;
}) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const light = lightOf(a, killSwitch);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || busy) return;
    setBusy(true);
    setErr(null);
    setAnswer(null);
    try {
      await onRun(question.trim());
      setQuestion("");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Run failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-panel border border-border bg-surface shadow-panel">
      <div className="flex flex-wrap items-start gap-3 px-4 py-3">
        <span
          aria-hidden
          className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", light.dot)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-sm font-semibold text-fg">
              {zh ? a.nameZh : a.name}
            </h3>
            <Badge tone={a.paused || killSwitch ? "neutral" : light.tone}>
              {killSwitch
                ? zh ? "全局停止" : "halted"
                : a.paused
                  ? zh ? "已暂停" : "paused"
                  : zh ? "运行中" : "active"}
            </Badge>
          </div>
          <p className="mt-1 text-2xs leading-relaxed text-muted">
            {zh ? a.missionZh : a.mission}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Autonomy dial. Phase 1 is the default for every new analyst. */}
          <div className="flex rounded border border-border bg-bg p-0.5" role="group">
            {PHASES.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={a.phase === p.value}
                onClick={() => void onControl({ phase: p.value })}
                className={cn(
                  "rounded px-2 py-0.5 font-mono text-2xs uppercase tracking-wide transition-colors",
                  a.phase === p.value
                    ? "bg-surface-2 text-fg"
                    : "text-faint hover:text-fg",
                )}
              >
                {zh ? p.labelZh : p.labelEn}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void onControl({ paused: !a.paused })}
            className={cn(
              "rounded border px-2.5 py-1 font-mono text-2xs uppercase tracking-wide transition-colors",
              a.paused
                ? "border-positive/40 text-positive hover:bg-positive/10"
                : "border-border text-faint hover:text-fg",
            )}
          >
            {a.paused ? (zh ? "恢复" : "resume") : zh ? "暂停" : "pause"}
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="grid h-7 w-7 place-items-center rounded text-faint transition-colors hover:text-fg"
          >
            <span aria-hidden className="text-xs">
              {open ? "−" : "+"}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-surface-3 px-4 py-3">
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <p className="eyebrow mb-1.5">{zh ? "职责" : "Owns"}</p>
              <ul className="flex flex-col gap-1">
                {a.responsibilities.map((r) => (
                  <li key={r} className="text-2xs leading-relaxed text-muted">
                    · {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-1.5">{zh ? "数据来源" : "Sources"}</p>
              <ul className="flex flex-col gap-1">
                {a.sources.map((s) => (
                  <li key={s} className="text-2xs leading-relaxed text-muted">
                    · {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              {/* The boundaries are the product: an analyst straying outside
                  its mandate is the failure mode this console exists to catch. */}
              <p className="eyebrow mb-1.5 text-negative/70">
                {zh ? "绝不做" : "Never does"}
              </p>
              <ul className="flex flex-col gap-1">
                {a.boundaries.map((b) => (
                  <li key={b} className="text-2xs leading-relaxed text-muted">
                    · {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                zh ? "向这位分析师提问…" : "Ask this analyst…"
              }
              disabled={a.paused || killSwitch}
              className="min-w-0 flex-1 rounded border border-border bg-surface px-2.5 py-1.5 text-sm text-fg placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!question.trim() || busy || a.paused || killSwitch}
              className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? (zh ? "运行中…" : "Running…") : zh ? "运行" : "Run"}
            </button>
          </form>

          {err ? (
            <p role="alert" className="mt-2 text-2xs text-negative">
              {err}
            </p>
          ) : null}
          {answer ? (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded border border-border-soft bg-surface p-3 text-2xs leading-relaxed text-fg">
              {answer}
            </pre>
          ) : null}

          {a.recentRuns.length > 0 ? (
            <div className="mt-4">
              <p className="eyebrow mb-1.5">{zh ? "最近运行" : "Recent runs"}</p>
              <ul className="flex flex-col divide-y divide-border-soft">
                {a.recentRuns.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 py-1.5 text-2xs"
                  >
                    <Badge
                      tone={
                        r.status === "ok"
                          ? "positive"
                          : r.status === "error"
                            ? "negative"
                            : "warning"
                      }
                    >
                      {r.status}
                    </Badge>
                    <span className="num text-faint">
                      {fmtDateTime(r.startedAt)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-muted">
                      {r.summary ?? r.error ?? r.request ?? "—"}
                    </span>
                    <span className="num shrink-0 text-faint">
                      {fmtNumber(r.tokensIn + r.tokensOut)} tok
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AgentConsole() {
  const { department, status, error, setControl, run } = useAnalysts();
  const { locale } = useLocale();
  const zh = locale === "zh";
  const { analysts, killSwitch, configured } = department;

  const active = analysts.filter((a) => !a.paused).length;
  const totalRuns = analysts.reduce((n, a) => n + a.recentRuns.length, 0);
  const errors = analysts.filter((a) => a.lastRun?.status === "error").length;

  return (
    <DataState status={status} error={error ?? undefined}>
      <div className="mb-6">
        <StatGrid
          items={[
            {
              label: zh ? "分析师" : "Analysts",
              value: String(analysts.length),
              hint: zh ? `${active} 运行中` : `${active} active`,
            },
            {
              label: zh ? "近期运行" : "Recent runs",
              value: String(totalRuns),
              hint: zh ? `${errors} 失败` : `${errors} failed`,
            },
            {
              label: zh ? "Claude 连接" : "Claude",
              value: configured ? (zh ? "已配置" : "ready") : "—",
              hint: configured ? undefined : zh ? "缺少密钥" : "key missing",
            },
            {
              label: zh ? "全局急停" : "Kill switch",
              value: killSwitch ? (zh ? "已启用" : "ON") : zh ? "关闭" : "off",
              hint: zh ? "停止全部 Agent" : "halts every agent",
            },
          ]}
        />
      </div>

      <ChartContainer
        title={zh ? "研究部门" : "Research department"}
        subtitle={
          zh
            ? "V1 只建知识，不做投资决策"
            : "V1 builds knowledge, not investment decisions"
        }
        actions={
          <button
            type="button"
            onClick={() => void setControl("ALL", { paused: !killSwitch })}
            className={cn(
              "rounded border px-2.5 py-1 font-mono text-2xs uppercase tracking-wide transition-colors",
              killSwitch
                ? "border-positive/40 text-positive hover:bg-positive/10"
                : "border-negative/40 text-negative hover:bg-negative/10",
            )}
          >
            {killSwitch
              ? zh ? "解除急停" : "release"
              : zh ? "全局急停" : "halt all"}
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          {analysts.map((a) => (
            <AnalystCard
              key={a.id}
              a={a}
              killSwitch={killSwitch}
              onControl={(patch) => setControl(a.id, patch)}
              onRun={async (q) => {
                await run(a.id as AnalystId, q);
              }}
            />
          ))}
        </div>
      </ChartContainer>
    </DataState>
  );
}
