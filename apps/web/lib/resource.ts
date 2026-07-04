import type { ResourceStatus } from "@/components/ui/data-state";

/**
 * Resource envelope — the shape every data loader returns, mapping 1:1 onto
 * <DataState>. Today loaders wrap mock data with `ready(...)`; when the backend
 * lands they wrap a real request the same way. Pages never branch on
 * loading/error themselves — they hand `resource.status` to <DataState>.
 */
export interface Resource<T> {
  status: ResourceStatus;
  data?: T;
  /** Plain-language message for the error state (never a status code). */
  message?: string;
}

export function ready<T>(data: T): Resource<T> {
  return { status: "ready", data };
}

export function loading<T>(): Resource<T> {
  return { status: "loading" };
}

export function empty<T>(): Resource<T> {
  return { status: "empty" };
}

export function failed<T>(message?: string): Resource<T> {
  return { status: "error", message };
}

/** Treat a ready resource whose data is an empty array as the empty state. */
export function fromList<T>(items: T[]): Resource<T[]> {
  return items.length === 0 ? empty<T[]>() : ready(items);
}
