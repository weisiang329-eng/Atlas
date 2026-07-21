"use client";

/**
 * Client-side data loading for the static-export site.
 *
 * The site ships as static HTML on Cloudflare Pages; live data arrives by
 * client fetch against the Atlas API Worker. This hook is the loader seam
 * from integration-points.md realised for that constraint:
 *
 *   useApiResource<T>(path) → Resource<T> → <DataState status={r.status}>
 *
 * Behaviour:
 *   - API configured  → loading → ready | empty (empty array) | error.
 *   - API not configured → the `fallback` resource (the labelled sample data
 *     that shipped before wiring), so previews and API-less builds still work.
 *   - `path: null` → stays loading (used while a subject id is not yet known).
 */
import { useEffect, useState } from "react";
import { apiFetch, ApiError, isApiConfigured } from "@/lib/api/client";
import { empty, failed, loading, ready, type Resource } from "@/lib/resource";

export function useApiResource<T>(
  path: string | null,
  fallback?: Resource<T>,
): Resource<T> {
  const [resource, setResource] = useState<Resource<T>>(loading<T>());

  useEffect(() => {
    if (!isApiConfigured()) {
      if (fallback) setResource(fallback);
      // No API and no fallback: stay in loading — the view has nothing truthful
      // to show; this only occurs before deploy config is set.
      return;
    }
    if (path === null) return;

    let cancelled = false;
    setResource(loading<T>());
    apiFetch<T>(path)
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length === 0) {
          setResource(empty<T>());
        } else {
          setResource(ready(data));
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // 404 on a data endpoint means "no coverage yet", not a failure.
        if (err instanceof ApiError && err.status === 404) {
          setResource(empty<T>());
        } else {
          setResource(
            failed<T>(
              err instanceof ApiError
                ? err.message
                : "The request could not be completed.",
            ),
          );
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fallback is a stable literal per call site
  }, [path]);

  return resource;
}
