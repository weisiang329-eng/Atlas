"use client";

/**
 * The research department, served by /v1/analysts.
 *
 * Read-only mandate metadata plus live control state, so the console can show
 * both what an analyst is FOR and what it is currently allowed to DO.
 */
import { useCallback, useEffect, useState } from "react";
import { apiFetch, isApiConfigured } from "@/lib/api/client";

export type AnalystId =
  | "coordinator"
  | "industry"
  | "company"
  | "news"
  | "comparison";

export interface AnalystRun {
  id: string;
  agent: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "ok" | "error";
  request: string | null;
  summary: string | null;
  output: string | null;
  tokensIn: number;
  tokensOut: number;
  error: string | null;
}

export interface Analyst {
  id: AnalystId;
  name: string;
  nameZh: string;
  mission: string;
  missionZh: string;
  responsibilities: string[];
  sources: string[];
  boundaries: string[];
  deliverables: string[];
  paused: boolean;
  /** 1 propose · 2 auto-tune · 3 full-auto. */
  phase: number;
  lastRun: AnalystRun | null;
  recentRuns: AnalystRun[];
}

export interface Department {
  configured: boolean;
  killSwitch: boolean;
  analysts: Analyst[];
}

const EMPTY: Department = { configured: false, killSwitch: false, analysts: [] };

export function useAnalysts() {
  const live = isApiConfigured();
  const [department, setDepartment] = useState<Department>(EMPTY);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    live ? "loading" : "ready",
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) {
      setStatus("ready");
      return;
    }
    try {
      setDepartment(await apiFetch<Department>("/v1/analysts"));
      setStatus("ready");
      setError(null);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not load the department.");
    }
  }, [live]);

  useEffect(() => {
    void load();
  }, [load]);

  const setControl = useCallback(
    async (agent: string, patch: { paused?: boolean; phase?: number }) => {
      await apiFetch(`/v1/analysts/${agent}/control`, {
        method: "POST",
        body: JSON.stringify(patch),
      });
      await load();
    },
    [load],
  );

  const run = useCallback(
    async (agent: AnalystId, question: string) => {
      const res = await apiFetch<{ answer: string; steps: number }>(
        `/v1/analysts/${agent}/run`,
        { method: "POST", body: JSON.stringify({ question }) },
      );
      await load();
      return res;
    },
    [load],
  );

  return { department, status, error, setControl, run, reload: load, live };
}
