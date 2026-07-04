/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static HTML export → deployable to Cloudflare Pages with zero runtime.
  // The app is client-rendered over mock data; no server data, API routes or
  // server actions. Redirects move to public/_redirects (export drops runtime
  // redirects()). Migrate to @opennextjs/cloudflare when real SSR is needed.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
