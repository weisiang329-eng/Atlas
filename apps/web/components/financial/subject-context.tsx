"use client";

/**
 * Financial subject — which company the /financials workspace analyses.
 *
 * Live mode (API configured): the subject list is the coverage universe from
 * the API (instant first paint from the static snapshot), defaulting to the
 * first company; the choice persists in localStorage. Sample mode (no API):
 * the single fictional sample subject, exactly as the workspace shipped
 * pre-wiring, clearly badged.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isApiConfigured } from "@/lib/api/client";
import { useApiResource } from "@/lib/loaders/use-api";
import { ready } from "@/lib/resource";
import { STATIC_UNIVERSE } from "@/lib/universe";
import type { CompanySummary } from "@/lib/types";

const STORAGE_KEY = "atlas.financials.subject";

export const SAMPLE_SUBJECT: CompanySummary = {
  id: "__sample__",
  name: "Helios Compute Corp",
  ticker: "HLXC",
  exchange: "—",
  segment: "Fictional sample entity",
  country: "—",
};

interface SubjectContextValue {
  subject: CompanySummary;
  companies: CompanySummary[];
  setSubjectId: (id: string) => void;
  /** True when showing the fictional sample (no API configured). */
  isSample: boolean;
}

const SubjectContext = createContext<SubjectContextValue | null>(null);

export function FinancialSubjectProvider({ children }: { children: ReactNode }) {
  const live = isApiConfigured();
  const companiesResource = useApiResource<CompanySummary[]>(
    live ? "/v1/companies" : null,
    ready(STATIC_UNIVERSE),
  );
  const companies = useMemo(
    () =>
      live
        ? (companiesResource.data ?? STATIC_UNIVERSE)
        : [SAMPLE_SUBJECT],
    [live, companiesResource.data],
  );

  const [subjectId, setSubjectId] = useState<string>(
    live ? STATIC_UNIVERSE[0]!.id : SAMPLE_SUBJECT.id,
  );

  // Restore persisted choice once on mount (client only).
  useEffect(() => {
    if (!live) return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setSubjectId(saved);
  }, [live]);

  const value = useMemo<SubjectContextValue>(() => {
    const subject =
      companies.find((c) => c.id === subjectId) ?? companies[0] ?? SAMPLE_SUBJECT;
    return {
      subject,
      companies,
      isSample: !live,
      setSubjectId: (id: string) => {
        setSubjectId(id);
        window.localStorage.setItem(STORAGE_KEY, id);
      },
    };
  }, [companies, subjectId, live]);

  return (
    <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>
  );
}

export function useFinancialSubject(): SubjectContextValue {
  const ctx = useContext(SubjectContext);
  if (!ctx) {
    throw new Error(
      "useFinancialSubject must be used inside FinancialSubjectProvider",
    );
  }
  return ctx;
}

/**
 * Endpoint path for the current subject, or null in sample mode (callers pass
 * their mock fallback through useApiResource instead).
 */
export function useSubjectPath(suffix: string): string | null {
  const { subject, isSample } = useFinancialSubject();
  return isSample ? null : `/v1/companies/${subject.id}${suffix}`;
}
