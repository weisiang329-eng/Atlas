/**
 * Knowledge-graph seed (P007 v1) — real supply-chain and competitive edges
 * across the coverage universe.
 *
 * `supplies`: from → to means "from is a supplier of to". `competes_with` is
 * symmetric (store once). Every edge cites publicly-known industry structure;
 * the seed source row records this provenance. Companies not in coverage
 * (e.g. NBR latex producers, hyperscaler customers) are omitted — v1 graphs
 * only edges between companies Atlas actually tracks.
 */
export const RELATIONSHIPS = [
  // --- AI-infra: foundry ----------------------------------------------------
  { from: "tsmc", to: "nvidia", type: "supplies", label: "foundry", note: "TSMC fabricates NVIDIA's leading-edge GPUs (N4/N5, CoWoS)." },
  { from: "tsmc", to: "amd", type: "supplies", label: "foundry", note: "TSMC fabricates AMD's CPUs and GPUs." },
  { from: "tsmc", to: "broadcom", type: "supplies", label: "foundry", note: "TSMC fabricates Broadcom's networking + custom AI silicon." },
  { from: "tsmc", to: "arista", type: "supplies", label: "foundry", note: "Arista's switch silicon (via Broadcom) is TSMC-fabricated." },
  // --- AI-infra: memory (HBM) ----------------------------------------------
  { from: "sk-hynix", to: "nvidia", type: "supplies", label: "HBM", note: "SK hynix is the lead HBM supplier for NVIDIA accelerators." },
  { from: "micron", to: "nvidia", type: "supplies", label: "HBM", note: "Micron supplies HBM3E into NVIDIA accelerators." },
  // --- AI-infra: equipment (lithography) -----------------------------------
  { from: "asml", to: "tsmc", type: "supplies", label: "EUV litho", note: "ASML supplies EUV/DUV lithography to TSMC." },
  { from: "asml", to: "intel", type: "supplies", label: "EUV litho", note: "ASML supplies lithography to Intel Foundry." },
  { from: "asml", to: "sk-hynix", type: "supplies", label: "litho", note: "ASML supplies lithography to SK hynix." },
  { from: "asml", to: "micron", type: "supplies", label: "litho", note: "ASML supplies lithography to Micron." },
  // --- AI-infra: networking silicon ----------------------------------------
  { from: "broadcom", to: "arista", type: "supplies", label: "switch ASIC", note: "Broadcom Tomahawk/Jericho silicon powers Arista switches." },
  // --- AI-infra: competition -----------------------------------------------
  { from: "nvidia", to: "amd", type: "competes_with", label: "AI accelerators", note: "GPU / AI accelerator rivalry." },
  { from: "nvidia", to: "intel", type: "competes_with", label: "AI / datacenter", note: "Datacenter compute rivalry." },
  { from: "amd", to: "intel", type: "competes_with", label: "x86 CPU", note: "x86 CPU rivalry (EPYC vs Xeon, Ryzen vs Core)." },
  { from: "tsmc", to: "intel", type: "competes_with", label: "foundry", note: "Leading-edge foundry rivalry (TSMC vs Intel Foundry)." },
  { from: "sk-hynix", to: "micron", type: "competes_with", label: "DRAM / HBM", note: "DRAM and HBM rivalry." },
  { from: "broadcom", to: "nvidia", type: "competes_with", label: "AI networking", note: "AI networking / custom-silicon overlap." },
  // --- Gloves: competition (big-4 + mid) -----------------------------------
  { from: "top-glove", to: "hartalega", type: "competes_with", label: "gloves", note: "Malaysian glove big-four rivalry." },
  { from: "top-glove", to: "kossan", type: "competes_with", label: "gloves", note: "Malaysian glove big-four rivalry." },
  { from: "top-glove", to: "supermax", type: "competes_with", label: "gloves", note: "Malaysian glove big-four rivalry." },
  { from: "hartalega", to: "kossan", type: "competes_with", label: "gloves", note: "Malaysian glove big-four rivalry." },
  { from: "hartalega", to: "supermax", type: "competes_with", label: "gloves", note: "Malaysian glove big-four rivalry." },
  { from: "kossan", to: "supermax", type: "competes_with", label: "gloves", note: "Malaysian glove big-four rivalry." },
];
