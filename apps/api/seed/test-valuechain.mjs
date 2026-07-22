/**
 * Verifies the value-chain builder (P006).
 *
 * The chain's claim is directional: "who feeds whom", upstream -> downstream
 * along equipment -> foundry -> memory -> accelerators -> networking -> power.
 * A direction bug is not a layout glitch — it would assert that NVIDIA
 * supplies TSMC, which is a false statement about the real world drawn as a
 * confident diagram. So the checks below concentrate on the edge filter:
 * same-stage and backwards edges must be dropped, not merely drawn faintly.
 */
import { buildValueChain } from "../src/domain/valuechain.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const ind = (id, order, name = id) => ({ id, name, sector: "Semiconductors", chainOrder: order });
const co = (id, industryId, ticker = id.toUpperCase()) => ({ id, name: id, ticker, industryId });
const rel = (fromId, toId, relationType = "supplies", label = null) => ({ fromId, toId, relationType, label });

const INDUSTRIES = [
  ind("equipment", 1),
  ind("foundry", 2),
  ind("memory", 3),
  ind("accelerators", 4),
  ind("unstaged", null, "Not on the chain"),
];
const COMPANIES = [
  co("asml", "equipment", "ASML"),
  co("tsmc", "foundry", "TSM"),
  co("hynix", "memory", "000660"),
  co("nvidia", "accelerators", "NVDA"),
  co("orphan", null, "ORPH"),
  co("offchain", "unstaged", "OFF"),
];

console.log("--- stages come out in chain order, unstaged industries excluded ---");
{
  const { stages } = buildValueChain(INDUSTRIES, COMPANIES, []);
  check("only staged industries appear", stages.map((s) => s.industryId), ["equipment", "foundry", "memory", "accelerators"]);
  check("an industry with no chainOrder is not a stage", stages.some((s) => s.industryId === "unstaged"), false);
  check("orders ascend", stages.map((s) => s.order), [1, 2, 3, 4]);
  check("companies are attached to their stage", stages.find((s) => s.industryId === "foundry").companies.map((c) => c.ticker), ["TSM"]);
  check("a company with no industry lands nowhere", stages.flatMap((s) => s.companies).some((c) => c.ticker === "ORPH"), false);
}

console.log("\n--- input order does not decide chain order ---");
{
  // Feed the industries in reverse; the chain must still read upstream-first.
  const { stages } = buildValueChain([...INDUSTRIES].reverse(), COMPANIES, []);
  check("still ordered by chainOrder, not array position",
    stages.map((s) => s.industryId), ["equipment", "foundry", "memory", "accelerators"]);
}

console.log("\n--- DIRECTION: only upstream -> downstream survives ---");
{
  const { edges } = buildValueChain(INDUSTRIES, COMPANIES, [
    rel("asml", "tsmc"),       // 1 -> 2, forwards: keep
    rel("tsmc", "nvidia"),     // 2 -> 4, forwards: keep
    rel("nvidia", "tsmc"),     // 4 -> 2, BACKWARDS: drop
    rel("hynix", "asml"),      // 3 -> 1, BACKWARDS: drop
  ]);
  check("two forward edges kept", edges.length, 2);
  check("ASML -> TSM", edges.some((e) => e.fromCompany === "ASML" && e.toCompany === "TSM"), true);
  check("TSM -> NVDA", edges.some((e) => e.fromCompany === "TSM" && e.toCompany === "NVDA"), true);
  check("NVDA -> TSM is NOT drawn (would be a false claim)",
    edges.some((e) => e.fromCompany === "NVDA" && e.toCompany === "TSM"), false);
  check("every edge runs strictly downstream",
    edges.every((e) => {
      const o = (id) => INDUSTRIES.find((i) => i.id === id).chainOrder;
      return o(e.fromStage) < o(e.toStage);
    }), true);
}

console.log("\n--- same-stage supply is not a chain edge ---");
{
  const twoInFoundry = [...COMPANIES, co("umc", "foundry", "UMC")];
  const { edges } = buildValueChain(INDUSTRIES, twoInFoundry, [rel("tsmc", "umc")]);
  check("a peer-to-peer edge inside one stage is dropped", edges.length, 0);
}

console.log("\n--- only 'supplies' relationships build the chain ---");
{
  const { edges } = buildValueChain(INDUSTRIES, COMPANIES, [
    rel("asml", "tsmc", "competes"),
    rel("asml", "tsmc", "invests_in"),
    rel("asml", "nvidia", "customer_of"),
  ]);
  check("non-supply relationships are ignored", edges, []);
}

console.log("\n--- edges to companies outside the chain are dropped, not half-drawn ---");
{
  const { edges } = buildValueChain(INDUSTRIES, COMPANIES, [
    rel("asml", "orphan"),    // target has no industry
    rel("orphan", "nvidia"),  // source has no industry
    rel("asml", "offchain"),  // target's industry has no chainOrder
    rel("asml", "ghost"),     // target does not exist at all
  ]);
  check("no dangling edges", edges, []);
}

console.log("\n--- labels and tickers are carried through ---");
{
  const { edges } = buildValueChain(INDUSTRIES, COMPANIES, [
    rel("asml", "tsmc", "supplies", "EUV lithography systems"),
    rel("tsmc", "nvidia", "supplies", null),
  ]);
  check("label preserved", edges[0].label, "EUV lithography systems");
  check("a missing label stays null, not an empty string", edges[1].label, null);
  check("companies are identified by ticker, not id", [edges[0].fromCompany, edges[0].toCompany], ["ASML", "TSM"]);
}

console.log("\n--- empty inputs produce an empty chain, not a crash ---");
{
  const empty = buildValueChain([], [], []);
  check("no stages", empty.stages, []);
  check("no edges", empty.edges, []);
  const noRels = buildValueChain(INDUSTRIES, COMPANIES, []);
  check("stages without any relationships still render", noRels.stages.length, 4);
  check("and carry no edges", noRels.edges, []);
}

console.log(
  failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
