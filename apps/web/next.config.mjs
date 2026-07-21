import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static HTML export → deployable to Cloudflare Pages with zero runtime.
  // Live data arrives by client fetch against NEXT_PUBLIC_API_BASE_URL (the
  // Atlas API Worker); without it the app renders the labelled sample data.
  // Migrate to @opennextjs/cloudflare when real SSR is needed.
  output: "export",
  images: { unoptimized: true },
  // Pin the tracing root to the monorepo — stray lockfiles outside the repo
  // otherwise make Next guess the workspace root nondeterministically.
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
};

export default nextConfig;
