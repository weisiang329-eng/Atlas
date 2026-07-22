/**
 * Agent runtime (P020) — an Anthropic (Claude) tool-use loop over the Atlas
 * tools. Reads the API key from the Worker secret `ANTHROPIC_API_KEY` (set via
 * `wrangler secret put`); the key never touches source, the frontend, or logs.
 *
 * The loop: send the question + tool definitions to Claude → if Claude asks to
 * use tools, execute them against D1 and return the results → repeat until
 * Claude returns a final answer or the step budget is hit. Read-only tools, so
 * the agent can inspect everything and change nothing.
 */
import type { Db } from "../db/repo.ts";
import { TOOLS, TOOLS_BY_NAME } from "./tools.ts";

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_STEPS = 6;
const MAX_TOKENS = 1536;

const SYSTEM_PROMPT = `You are the Atlas research analyst — an assistant inside a decision-intelligence platform covering AI-infrastructure and Malaysian rubber-glove companies.

Answer using the tools, which return the platform's real, sourced data. Rules:
- Ground every number in a tool result. Never invent figures. If the data is missing, say so.
- Call list_companies first when you need a company id.
- Be concise and specific; prefer tables for comparisons. Cite the period (e.g. FY25) for financial figures.
- The Atlas Score is a systematic factor score, not investment advice. Never give buy/sell/hold recommendations or personalised investment advice — present the data and let the user decide, and say so if asked to recommend.`;

export interface AgentConfig {
  apiKey: string;
  model?: string;
  /**
   * Overrides the default analyst prompt. The research department passes each
   * analyst its own mandate here, so one runtime serves five roles without
   * five copies of the tool loop.
   */
  system?: string;
}

export interface AgentTrace {
  tool: string;
  input: unknown;
}

export interface AgentResult {
  answer: string;
  trace: AgentTrace[];
  steps: number;
  stopReason: string;
}

type Content =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Content[];
}

export function isAgentConfigured(env: { ANTHROPIC_API_KEY?: string }): boolean {
  return typeof env.ANTHROPIC_API_KEY === "string" && env.ANTHROPIC_API_KEY.length > 0;
}

async function callClaude(
  cfg: AgentConfig,
  messages: AnthropicMessage[],
): Promise<{ content: Content[]; stop_reason: string }> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cfg.model ?? DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: cfg.system ?? SYSTEM_PROMPT,
      tools: TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      })),
      messages,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as { content: Content[]; stop_reason: string };
}

/** Run the agent loop for one question. */
export async function runAgent(
  db: Db,
  cfg: AgentConfig,
  question: string,
): Promise<AgentResult> {
  const messages: AnthropicMessage[] = [{ role: "user", content: question }];
  const trace: AgentTrace[] = [];
  let steps = 0;

  while (steps < MAX_STEPS) {
    steps += 1;
    const reply = await callClaude(cfg, messages);
    messages.push({ role: "assistant", content: reply.content });

    const toolUses = reply.content.filter(
      (c): c is Extract<Content, { type: "tool_use" }> => c.type === "tool_use",
    );

    if (toolUses.length === 0) {
      const answer = reply.content
        .filter((c): c is Extract<Content, { type: "text" }> => c.type === "text")
        .map((c) => c.text)
        .join("\n")
        .trim();
      return { answer, trace, steps, stopReason: reply.stop_reason };
    }

    // Execute each requested tool and feed results back.
    const results: Content[] = [];
    for (const use of toolUses) {
      trace.push({ tool: use.name, input: use.input });
      const tool = TOOLS_BY_NAME.get(use.name);
      let output: unknown;
      try {
        output = tool
          ? await tool.execute(db, use.input ?? {})
          : { error: `Unknown tool '${use.name}'.` };
      } catch (err) {
        output = { error: err instanceof Error ? err.message : "Tool failed." };
      }
      results.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: JSON.stringify(output),
      });
    }
    messages.push({ role: "user", content: results });
  }

  return {
    answer:
      "I reached the step limit before finishing. Try a narrower question, or ask about one company at a time.",
    trace,
    steps,
    stopReason: "max_steps",
  };
}
