/**
 * Verifies the CORS allowlist.
 *
 * Production was running `Access-Control-Allow-Origin: *` — any page on the
 * internet could read /v1/scores and /v1/pms/book (the trade ledger) out of a
 * visitor's browser, because there is no login yet.
 *
 * The wildcard form is the part worth testing. `*.atlas-web-2yd.pages.dev`
 * must match the per-deploy preview subdomains and must NOT match a
 * look-alike domain an attacker can register, which is exactly what a naive
 * `endsWith("atlas-web-2yd.pages.dev")` would do.
 */
import { originAllowed } from "../src/http/cors.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = actual === expected;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const LIST = "https://atlas-web-2yd.pages.dev,*.atlas-web-2yd.pages.dev";

console.log("--- the real site and its previews are allowed ---");
check("production origin", originAllowed(LIST, "https://atlas-web-2yd.pages.dev"), true);
check("a hash preview deploy", originAllowed(LIST, "https://4d9459ee.atlas-web-2yd.pages.dev"), true);
check("a named preview alias", originAllowed(LIST, "https://compose-preview.atlas-web-2yd.pages.dev"), true);

console.log("\n--- everything else is refused ---");
check("an unrelated site", originAllowed(LIST, "https://evil-example.com"), false);
check("a look-alike suffix", originAllowed(LIST, "https://evilatlas-web-2yd.pages.dev"), false);
check("a look-alike with a hyphen", originAllowed(LIST, "https://evil-atlas-web-2yd.pages.dev"), false);
check("the domain as a PATH on another host", originAllowed(LIST, "https://evil.com/atlas-web-2yd.pages.dev"), false);
check("a subdomain of an attacker domain", originAllowed(LIST, "https://atlas-web-2yd.pages.dev.evil.com"), false);
// http:// is a different origin from https:// and the site is https-only,
// so it is correctly refused — a downgrade must not inherit the allowance.
check("plain http is refused", originAllowed(LIST, "http://atlas-web-2yd.pages.dev"), false);
check("garbage is not an origin", originAllowed(LIST, "not-a-url"), false);
check("empty origin", originAllowed(LIST, ""), false);

console.log("\n--- an exact-only list does not accidentally allow subdomains ---");
{
  const exact = "https://atlas-web-2yd.pages.dev";
  check("exact match", originAllowed(exact, "https://atlas-web-2yd.pages.dev"), true);
  check("subdomain refused without a wildcard", originAllowed(exact, "https://x.atlas-web-2yd.pages.dev"), false);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
