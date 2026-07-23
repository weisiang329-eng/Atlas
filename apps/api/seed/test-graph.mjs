/**
 * Verifies the knowledge-graph builders (`domain/graph.ts`, P007).
 *
 * The property that matters is DIRECTIONALITY. `supplies` is a directed edge:
 * the same relationship row makes the subject a customer when it reads the
 * edge outward and a supplier when it reads it inward. Get that backwards and
 * the graph tells the reader that NVIDIA supplies TSMC — the exact inverse of
 * the truth, stated with a confident arrow. So the tests below assert the
 * role each side sees, not just that an edge exists.
 */
import { buildEgoGraph, buildFullGraph } from "../src/domain/graph.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const co = (id, name, ticker = id.toUpperCase()) => ({
  id, name, ticker, exchange: "X", segment: "S", country: "C",
  industryId: null, description: null, headquarters: null, foundedYear: null,
  website: null, reportingCurrency: "USD", fiscalYearEndMonth: null, createdAt: null,
});
const rel = (fromId, toId, relationType, label = null, note = null) => ({
  id: 1, fromId, toId, relationType, label, note, sourceId: null, createdAt: null,
});

const NAMES = { tsmc: "TSMC", nvidia: "NVIDIA", amd: "AMD", asml: "ASML" };
const nameOf = (id) => NAMES[id] ?? id;

console.log("--- ego graph: the direction a 'supplies' edge is read from ---");
{
  // TSMC supplies NVIDIA:  tsmc --supplies--> nvidia
  const supplies = rel("tsmc", "nvidia", "supplies", "foundry");

  const fromNvidia = buildEgoGraph(co("nvidia", "NVIDIA"), [supplies], nameOf);
  // NVIDIA is the BUYER (the `to`), so the other side is its SUPPLIER.
  check("the buyer sees the other as a supplier",
    fromNvidia.relations[0].relation, "Supplier");
  check("and the edge from the buyer reads 'supplied by'",
    fromNvidia.edges[0].label, "supplied by");
  check("the qualifier label survives", fromNvidia.relations[0].label, "foundry");

  const fromTsmc = buildEgoGraph(co("tsmc", "TSMC"), [supplies], nameOf);
  // TSMC is the SELLER (the `from`), so the other side is its CUSTOMER.
  check("the seller sees the other as a customer",
    fromTsmc.relations[0].relation, "Customer");
  check("and the edge from the seller reads 'supplies'",
    fromTsmc.edges[0].label, "supplies");
}

console.log("\n--- competition is symmetric, supply is not ---");
{
  const competes = rel("nvidia", "amd", "competes_with");
  const a = buildEgoGraph(co("nvidia", "NVIDIA"), [competes], nameOf);
  const b = buildEgoGraph(co("amd", "AMD"), [competes], nameOf);
  check("both sides of a competes edge are competitors",
    [a.relations[0].relation, b.relations[0].relation], ["Competitor", "Competitor"]);
}

console.log("\n--- the subject is always the centre, never its own neighbour ---");
{
  const g = buildEgoGraph(co("nvidia", "NVIDIA"), [
    rel("nvidia", "nvidia", "competes_with"), // self-loop: must be ignored
    rel("tsmc", "nvidia", "supplies"),
  ], nameOf);
  check("the centre node is the subject", g.nodes[0].kind, "company");
  check("a self-relationship is dropped", g.relations.length, 1);
  check("exactly one neighbour node besides the centre", g.nodes.length, 2);
}

console.log("\n--- a repeated counterparty is one node, and rows are ordered ---");
{
  const g = buildEgoGraph(co("nvidia", "NVIDIA"), [
    rel("amd", "nvidia", "supplies"),      // supplier
    rel("nvidia", "amd", "competes_with"), // ...also a competitor
    rel("tsmc", "nvidia", "supplies"),     // another supplier
  ], nameOf);
  const nodeIds = g.nodes.map((n) => n.id).sort();
  check("AMD appears as a single node despite two relationships",
    nodeIds, ["amd", "nvidia", "tsmc"]);
  // Ordering is supplier(1) < customer(2) < competitor(3); within a kind, by name.
  check("relations are grouped supplier→customer→competitor",
    g.relations.map((r) => r.relation), ["Supplier", "Supplier", "Competitor"]);
  check("within a kind they sort by name (AMD before TSMC)",
    g.relations.filter((r) => r.relation === "Supplier").map((r) => r.name),
    ["AMD", "TSMC"]);
}

console.log("\n--- the full universe graph ---");
{
  const companies = [co("nvidia", "NVIDIA"), co("tsmc", "TSMC"), co("orphan", "Orphan")];
  const rels = [rel("tsmc", "nvidia", "supplies")];
  const g = buildFullGraph(companies, rels);
  check("only companies that appear in a relationship are nodes",
    g.nodes.map((n) => n.id).sort(), ["nvidia", "tsmc"]);
  check("an unconnected company is not drawn", g.nodes.some((n) => n.id === "orphan"), false);
  check("full-graph nodes are labelled by ticker, not name",
    g.nodes.find((n) => n.id === "nvidia").label, "NVIDIA");
  check("the edge carries the relation type", g.edges[0].label, "supplies");
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
