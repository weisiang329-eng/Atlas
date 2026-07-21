/**
 * Typed API client — the single integration seam to the Atlas backend.
 *
 * PREPARED, NOT WIRED. Nothing in the app imports this yet; it exists so that
 * when Codex publishes backend contracts, data loaders call `apiFetch` here
 * instead of scattering `fetch` across components. The UI never talks to a URL
 * directly, and no component is coupled to an unfinished endpoint.
 *
 * Contract when it lands:
 *   loader → apiFetch<T>(path) → Resource<T> (see ./resource) → <DataState/>
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiConfigured(): boolean {
  return BASE_URL.length > 0;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(0, "The API base URL is not configured.");
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    // Surface the server's own message. Writes validate their input, and a
    // form that can only say "the request could not be completed" leaves the
    // user guessing which field was wrong.
    let message = "The request could not be completed.";
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body.error === "string" && body.error) message = body.error;
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}
