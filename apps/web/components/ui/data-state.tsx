import type { ReactNode } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * The single place the UI models an async resource. Pages render mock data with
 * `status="ready"` today; when a backend contract lands, the same component
 * takes a real request's derived status with zero layout changes. This is the
 * clean API-decoupling boundary the platform is built around.
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
  if (status === "loading") return <>{loading ?? <LoadingState />}</>;
  if (status === "error") return <>{error ?? <ErrorState />}</>;
  if (status === "empty")
    return (
      <>
        {empty ?? (
          <EmptyState
            title="Nothing here yet"
            body="There is no data to show for this view."
          />
        )}
      </>
    );
  return <>{children}</>;
}
