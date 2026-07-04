import { readFileSync } from "node:fs";

const requiredFiles = [
  "src/config.ts",
  "src/health.ts",
  "src/server.ts",
  "test/health.test.ts",
];

for (const relativePath of requiredFiles) {
  const content = readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

  if (content.includes("from \"./config.js\"") || content.includes("from \"./health.js\"")) {
    throw new Error(`${relativePath} must import TypeScript source files directly for dependency-free Node execution.`);
  }
}

const server = readFileSync(new URL("../src/server.ts", import.meta.url), "utf8");

if (!server.includes('request.method === "GET"') || !server.includes('request.url === "/health"')) {
  throw new Error("API server must expose the Sprint 000 GET /health smoke endpoint.");
}

console.log("Atlas API source validation passed.");
