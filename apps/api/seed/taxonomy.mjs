/**
 * The industry taxonomy — one tree, one source of truth.
 *
 * The design is `docs/INDUSTRY-INTELLIGENCE.md` §1. The rule that produced
 * this shape, and the only one that matters:
 *
 *   Two things belong in different leaves IF AND ONLY IF their drivers differ.
 *
 * That is why this is not GICS. GICS classifies by what you make, so it files
 * NVIDIA, Intel and Micron together under "Semiconductors" — three companies
 * moved by CoWoS packaging capacity, process yield, and inventory weeks
 * respectively. Nothing about that grouping helps a decision.
 *
 * Depth is deliberately uneven: a branch stops as soon as it is
 * driver-homogeneous. AI accelerators, networking and data-centre power stop
 * at depth 3 because one driver set covers each of them today; memory,
 * foundry, equipment and gloves split because theirs genuinely diverge.
 *
 * `level` is the node's depth, 1 at the root. It is schema vocabulary and
 * must never reach the screen — the breadcrumb conveys depth by nesting.
 *
 * NOTE ON THE DOC'S "L5": §1 sketches gloves reaching five levels. Under the
 * splitting rule they reach four (医疗保健 › 医疗耗材 › 手套 › 丁腈手套),
 * because no driver-distinct level exists between 手套 and the feedstock
 * split. If the owner wants a real fifth level (say 检查手套 vs 工业手套,
 * which differ in customer and cycle), it is one row per node — but it should
 * be added because the drivers differ, not to match a number in prose.
 */

/**
 * Every node, parents before children (the seed writes them in this order and
 * the FK requires it).
 *
 * `sector` is the denormalised display grouping that predates the tree; it is
 * kept because the value chain, scores and existing UI read it.
 */
export const TAXONOMY = [
  // ── roots ────────────────────────────────────────────────────────────────
  { id: "sector-technology", name: "Technology", nameZh: "科技", sector: "Technology", parentId: null, level: 1 },
  { id: "sector-healthcare", name: "Healthcare", nameZh: "医疗保健", sector: "Healthcare", parentId: null, level: 1 },

  // ── chain segments ───────────────────────────────────────────────────────
  { id: "chain-semiconductors", name: "Semiconductors", nameZh: "半导体", sector: "Semiconductors", parentId: "sector-technology", level: 2 },
  { id: "chain-ai-infrastructure", name: "AI Infrastructure", nameZh: "AI 基础设施", sector: "AI Infrastructure", parentId: "sector-technology", level: 2 },
  { id: "chain-medical-consumables", name: "Medical Consumables", nameZh: "医疗耗材", sector: "Healthcare Manufacturing", parentId: "sector-healthcare", level: 2 },

  // ── industries (the seven that already existed) ───────────────────────────
  { id: "semis-equipment", nameZh: "半导体设备", parentId: "chain-semiconductors", level: 3 },
  { id: "semis-foundry", nameZh: "代工", parentId: "chain-semiconductors", level: 3 },
  { id: "semis-memory", nameZh: "存储", parentId: "chain-semiconductors", level: 3 },
  { id: "semis-accelerators", nameZh: "AI 加速器", parentId: "chain-semiconductors", level: 3 },
  { id: "networking", nameZh: "网络 / ASIC", parentId: "chain-ai-infrastructure", level: 3 },
  { id: "dc-power-cooling", nameZh: "数据中心电力与散热", parentId: "chain-ai-infrastructure", level: 3 },
  { id: "rubber-gloves", nameZh: "手套", parentId: "chain-medical-consumables", level: 3 },

  // ── sub-industries: split ONLY where the drivers diverge ──────────────────
  // Memory: HBM is supply-bound to AI capex and CoWoS allocation; commodity
  // DRAM follows phone and PC demand; NAND runs its own capacity cycle.
  { id: "memory-dram", name: "DRAM", nameZh: "DRAM", sector: "Semiconductors", parentId: "semis-memory", level: 4 },
  { id: "memory-nand", name: "NAND", nameZh: "NAND", sector: "Semiconductors", parentId: "semis-memory", level: 4 },
  { id: "memory-hbm", name: "HBM", nameZh: "HBM", sector: "Semiconductors", parentId: "semis-memory", level: 4 },

  // Foundry: advanced nodes follow customer capex, mature nodes follow
  // automotive and industrial inventory — frequently out of phase, not merely
  // different in amplitude.
  { id: "foundry-advanced", name: "Advanced Node Foundry", nameZh: "先进制程代工", sector: "Semiconductors", parentId: "semis-foundry", level: 4 },
  { id: "foundry-mature", name: "Mature Node Foundry", nameZh: "成熟制程代工", sector: "Semiconductors", parentId: "semis-foundry", level: 4 },

  // Equipment: front-end tracks wafer-fab capex (the earliest signal in the
  // whole chain); back-end tracks packaging and test, which turns later and
  // is currently driven by advanced packaging rather than by wafer starts.
  { id: "equipment-frontend", name: "Front-End Equipment", nameZh: "前道设备", sector: "Semiconductors", parentId: "semis-equipment", level: 4 },
  { id: "equipment-backend", name: "Back-End Equipment", nameZh: "后道封测设备", sector: "Semiconductors", parentId: "semis-equipment", level: 4 },

  // Gloves: NBR tracks oil → butadiene; NR tracks an agricultural crop with
  // its own weather and tapping season. Makers carry different product mixes,
  // so the same latex move hurts them by different amounts.
  { id: "gloves-nitrile", name: "Nitrile Gloves", nameZh: "丁腈手套", sector: "Healthcare Manufacturing", parentId: "rubber-gloves", level: 4 },
  { id: "gloves-natural", name: "Natural Rubber Gloves", nameZh: "天然胶手套", sector: "Healthcare Manufacturing", parentId: "rubber-gloves", level: 4 },
];

/** The nodes the taxonomy introduces (the seven pre-existing ones carry no name here). */
export const NEW_NODES = TAXONOMY.filter((n) => n.name !== undefined);

/** Placement updates for nodes that already exist in `industry`. */
export const PLACEMENTS = TAXONOMY.map((n) => ({
  id: n.id,
  nameZh: n.nameZh,
  parentId: n.parentId,
  level: n.level,
}));
