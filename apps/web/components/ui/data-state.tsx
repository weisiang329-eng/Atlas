"use client";

import type { ReactNode } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/lib/i18n/use-locale";

/**
 * The single place the UI models an async resource. Pages render mock data with
 * `status="ready"` today; when a backend contract lands, the same component
 * takes a real request's derived status with zero layout changes. This is the
 * clean API-decoupling boundary the platform is built around.
 *
 * It is also the one chokepoint every data page routes its loading / empty /
 * error state through, so the DEFAULT messages are localised here — one edit,
 * and the whole app's async chrome follows the language switch. A caller that
 * passes its own `loading`/`error`/`empty` node still overrides these; this
 * only fixes the previously English-only fallbacks.
 */
export type ResourceStatus = "loading" | "error" | "empty" | "ready";

interface DataStateProps {
  status: ResourceStatus;
  loading?: ReactNode;
  error?: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
}

export function DataState({
  status,
  loading,
  error,
  empty,
  children,
}: DataStateProps) {
  const { locale } = useLocale();
  const zh = locale === "zh";

  if (status === "loading")
    return <>{loading ?? <LoadingState label={zh ? "加载中" : "Loading"} />}</>;
  if (status === "error")
    return (
      <>
        {error ?? (
          <ErrorState
            title={zh ? "出错了" : "Something went wrong"}
            message={
              zh
                ? "此部分无法加载，请重试。"
                : "This section could not be loaded. Please try again."
            }
          />
        )}
      </>
    );
  if (status === "empty")
    return (
      <>
        {empty ?? (
          <EmptyState
            title={zh ? "暂无数据" : "Nothing here yet"}
            body={
              zh
                ? "此视图暂无可显示的数据。"
                : "There is no data to show for this view."
            }
          />
        )}
      </>
    );
  return <>{children}</>;
}
