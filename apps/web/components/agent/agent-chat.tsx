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
import type { AgentResult, AgentStatus } from "@/lib/types";

interface Turn {
  question: string;
  result?: AgentResult;
  error?: string;
  pending?: boolean;
}

const SUGGESTIONS = [
  "Which company has the highest Atlas Score, and why?",
  "Compare NVIDIA and AMD on profitability and growth.",
  "Who are NVIDIA's suppliers and what do they provide?",
  "How is the rubber-glove margin cycle looking?",
];

export function AgentChat() {
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
      const msg = err instanceof ApiError ? err.message : "The request could not be completed.";
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { question: q, error: msg } : turn)));
    } finally {
      setBusy(false);
    }
  }

  if (!isApiConfigured()) {
    return (
      <EmptyState
        title="API not configured"
        body="Set NEXT_PUBLIC_API_BASE_URL at build time to use the research analyst."
      />
    );
  }

  if (status && !status.configured) {
    return (
      <Panel>
        <PanelBody>
          <h2 className="font-serif text-lg text-fg">Research analyst — setup</h2>
          <p className="mt-2 text-sm text-muted">
            The agent answers questions using Atlas&rsquo;s real data via Claude.
            It needs your Anthropic API key set as a Worker secret (it never
            passes through the browser):
          </p>
          <pre className="mt-3 overflow-x-auto rounded border border-border bg-surface-2 p-3 font-mono text-xs text-fg">
{`cd apps/api
wrangler secret put ANTHROPIC_API_KEY   # paste your key when prompted
wrangler deploy                          # redeploy the Worker`}
          </pre>
          <p className="mt-3 text-xs text-faint">
            For local dev, put it in <code>apps/api/.dev.vars</code> instead. Get
            a key at console.anthropic.com.
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
              Ask about any covered company, industry or ranking. The analyst
              answers from Atlas&rsquo;s real data and shows the tools it used.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded border border-border bg-surface px-3 py-1.5 text-left text-xs text-muted transition-colors hover:border-accent-dim hover:text-fg"
                >
                  {s}
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
                <p className="text-sm text-muted">Analysing&hellip;</p>
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
                        Tools used
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
          placeholder="Ask the research analyst…"
          className="flex-1 rounded border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent-dim"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded border border-accent-dim bg-surface-2 px-4 py-2 text-sm text-accent disabled:opacity-50"
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
      <div ref={endRef} />
    </div>
  );
}
