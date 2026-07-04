/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Sprint 000 placeholder routes, superseded by the Milestone 1 workspaces.
      { source: "/dashboard", destination: "/", permanent: false },
      { source: "/company", destination: "/companies", permanent: false },
    ];
  },
};

export default nextConfig;
