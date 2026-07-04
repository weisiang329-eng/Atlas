import { readFileSync } from "node:fs";

const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const requiredSnippets = [
  'provider = "postgresql"',
  'url      = env("DATABASE_URL")',
  'model Company',
  'model CompanyIdentifier',
];

const missing = requiredSnippets.filter((snippet) => !schema.includes(snippet));

if (missing.length > 0) {
  throw new Error(`Prisma schema is missing required foundation snippets: ${missing.join(", ")}`);
}

console.log("Prisma schema foundation validation passed.");
