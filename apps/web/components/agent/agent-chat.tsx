"use client";

/**
 * Atlas research analyst chat (P020). Sends questions to /v1/agent/ask, which
 * runs a Claude tool-use loop over the platform's real data, and renders the
 * answer plus which tools the agent called. Degrades to setup guidance when
 * the ANTHROPIC_API_KEY secret is not configured.
 */
import { useEffect, useRef, useState } from "react";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch, ApiError, isApiConfigured } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n/use-locale";
import type { AgentResult, AgentStatus } from "@/lib/types";

interface Turn {
  question: string;
  result?: AgentResult;
  error?: string;
  pending?: boolean;
}

const SUGGESTIONS: { en: string; zh: string }[] = [
  {
    en: "Which company has the highest Atlas Score, and why?",
    zh: "哪家公司的 Atlas 评分最高？原因是什么？",
  },
  {
    en: "Compare NVIDIA and AMD on profitability and growth.",
    zh: "对比 NVIDIA 与 AMD 的盈利能力与成长性。",
  },
  {
    en: "Who are NVIDIA's suppliers and what do they provide?",
    zh: "NVIDIA 有哪些供应商，各自提供什么？",
  },
  {
    en: "How is the rubber-glove margin cycle looking?",
    zh: "橡胶手套的利润率周期目前如何？",
  },
];

export function AgentChat() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isApiConfigured()) return;
    apiFetch<AgentStatus>("/v1/agent/status")
      .then(setStatus)
      .catch(() => setStatus({ configured: false, model: "" }));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    setTurns((t) => [...t, { question: q, pending: true }]);
    try {
      const result = await apiFetch<AgentResult>("/v1/agent/ask", {
        method: "POST",
        body: JSON.stringify({ question: q }),
      });
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { question: q, result } : turn)));
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : zh
            ? "请求无法完成。"
            : "The request could not be completed.";
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { question: q, error: msg } : turn)));
    } finally {
      setBusy(false);
    }
  }

  if (!isApiConfigured()) {
    return (
      <EmptyState
        title={zh ? "API 未配置" : "API not configured"}
        body={
          zh
            ? "在构建时设置 NEXT_PUBLIC_API_BASE_URL 以使用研究分析师。"
            : "Set NEXT_PUBLIC_API_BASE_URL at build time to use the research analyst."
        }
      />
    );
  }

  if (status && !status.configured) {
    return (
      <Panel>
        <PanelBody>
          <h2 className="font-serif text-lg text-fg">
            {zh ? "研究分析师 — 设置" : "Research analyst — setup"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {zh ? (
              <>
                分析师通过 Claude 使用 Atlas 的真实数据回答问题。需要将你的
                Anthropic API 密钥设置为 Worker secret（它绝不会经过浏览器）：
              </>
            ) : (
              <>
                The agent answers questions using Atlas&rsquo;s real data via
                Claude. It needs your Anthropic API key set as a Worker secret
                (it never passes through the browser):
              </>
            )}
          </p>
          <pre className="mt-3 overflow-x-auto rounded border border-border bg-surface-2 p-3 font-mono text-xs text-fg">
{`cd apps/api
wrangler secret put ANTHROPIC_API_KEY   # paste your key when prompted
wrangler deploy                          # redeploy the Worker`}
          </pre>
          <p className="mt-3 text-xs text-faint">
            {zh ? (
              <>
                本地开发时，请改为放入 <code>apps/api/.dev.vars</code>。可在
                console.anthropic.com 获取密钥。
              </>
            ) : (
              <>
                For local dev, put it in <code>apps/api/.dev.vars</code> instead.
                Get a key at console.anthropic.com.
              </>
            )}
          </p>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {turns.length === 0 ? (
        <Panel>
          <PanelBody>
            <p className="text-sm text-muted">
              {zh ? (
                <>
                  可询问任意覆盖的公司、行业或排名。分析师依据 Atlas
                  的真实数据作答，并展示所用的工具。
                </>
              ) : (
                <>
                  Ask about any covered company, industry or ranking. The analyst
                  answers from Atlas&rsquo;s real data and shows the tools it used.
                </>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.en}
                  type="button"
                  onClick={() => ask(zh ? s.zh : s.en)}
                  className="rounded border border-border bg-surface px-3 py-1.5 text-left text-xs text-muted transition-colors hover:border-accent-dim hover:text-fg"
                >
                  {zh ? s.zh : s.en}
                </button>
              ))}
            </div>
          </PanelBody>
        </Panel>
      ) : null}

      {turns.map((turn, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-panel border border-accent-dim bg-surface-2 px-4 py-2.5 text-sm text-fg">
              {turn.question}
            </div>
          </div>
          <Panel>
            <PanelBody>
              {turn.pending ? (
                <p className="text-sm text-muted">{zh ? "分析中…" : "Analysing…"}</p>
              ) : turn.error ? (
                <p className="text-sm text-negative">{turn.error}</p>
              ) : (
                <>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
                    {turn.result?.answer}
                  </div>
                  {turn.result && turn.result.trace.length > 0 ? (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
                      <span className="text-2xs uppercase tracking-wide text-faint">
                        {zh ? "所用工具" : "Tools used"}
                      </span>
                      {turn.result.trace.map((t, j) => (
                        <Badge key={j} tone="neutral">{t.tool}</Badge>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </PanelBody>
          </Panel>
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={zh ? "向研究分析师提问…" : "Ask the research analyst…"}
          className="flex-1 rounded border border-border-soft bg-surface-3 px-3 py-2 text-sm text-fg outline-none focus:border-accent-dim"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded border border-accent-dim bg-surface-2 px-4 py-2 text-sm text-accent disabled:opacity-50"
        >
          {busy ? "…" : zh ? "提问" : "Ask"}
        </button>
      </form>
      <div ref={endRef} />
    </div>
  );
}
