/**
 * CORS allowlist.
 *
 * The web app is a static Cloudflare Pages site on a different origin, so the
 * API has to name who may call it. Left unset the policy is `*` — which is
 * what production was actually running: any page on the internet could read
 * /v1/scores, /v1/pms/book (the trade ledger: positions, cost, P&L) and the
 * rest straight out of a visitor's browser, because there is no login yet.
 *
 * Entries are exact origins, plus a `*.example.com` form that matches any
 * subdomain. The wildcard exists because every Pages deploy mints a fresh
 * `<hash>.atlas-web-2yd.pages.dev` preview; without it, listing only the
 * production domain would break every preview build used for review. Only
 * Cloudflare can create subdomains under that project, so the wildcard does
 * not widen the surface to third parties.
 */
export function originAllowed(allowed: string, origin: string): boolean {
  return allowed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .some((entry) => {
      if (!entry.startsWith("*.")) return entry === origin;
      // "*.foo.com" matches https://anything.foo.com, but never foo.com
      // itself and never a look-alike like https://evil-foo.com.
      const suffix = entry.slice(1); // ".foo.com"
      try {
        return new URL(origin).hostname.endsWith(suffix);
      } catch {
        return false;
      }
    });
}
