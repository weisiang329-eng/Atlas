/**
 * MOCK knowledge/relationship data — Phase 5 visualization.
 *
 * Fictional entities and illustrative values only; nothing sourced or computed.
 * Exists to shape the graph, heatmap and decision-tree primitives.
 */

export type EntityKind =
  | "company"
  | "supplier"
  | "customer"
  | "competitor"
  | "sector";

export interface GraphNode {
  id: string;
  label: string;
  kind: EntityKind;
}
export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

export const GRAPH_NODES: GraphNode[] = [
  { id: "helios", label: "Helios Compute", kind: "company" },
  { id: "foundry", label: "Foundry Co", kind: "supplier" },
  { id: "hbm", label: "HBM Supplier", kind: "supplier" },
  { id: "cooling", label: "Aurora Cooling", kind: "supplier" },
  { id: "hyperscaler", label: "Hyperscaler A", kind: "customer" },
  { id: "enterprise", label: "Enterprise B", kind: "customer" },
  { id: "rival", label: "Rival Accel", kind: "competitor" },
  { id: "ai-infra", label: "AI Infrastructure", kind: "sector" },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { from: "helios", to: "foundry", label: "supplied by" },
  { from: "helios", to: "hbm", label: "supplied by" },
  { from: "helios", to: "cooling", label: "supplied by" },
  { from: "helios", to: "hyperscaler", label: "sells to" },
  { from: "helios", to: "enterprise", label: "sells to" },
  { from: "helios", to: "rival", label: "competes with" },
  { from: "helios", to: "ai-infra", label: "operates in" },
];

// Heatmap: segment × period exposure/intensity (0–100), illustrative.
export const HEATMAP_ROWS = ["Compute", "Memory", "Networking", "Power", "Cooling"];
export const HEATMAP_COLS = ["FY21", "FY22", "FY23", "FY24"];
export const HEATMAP_VALUES: number[][] = [
  [40, 55, 72, 88],
  [35, 50, 65, 80],
  [30, 42, 55, 68],
  [20, 38, 60, 85],
  [15, 30, 52, 78],
];

export interface DecisionTreeNode {
  id: string;
  label: string;
  kind: "decision" | "option" | "outcome";
  children?: DecisionTreeNode[];
}

export const DECISION_TREE: DecisionTreeNode = {
  id: "root",
  label: "Raise conviction?",
  kind: "decision",
  children: [
    {
      id: "yes",
      label: "Raise",
      kind: "option",
      children: [
        { id: "yes-plays", label: "Thesis plays out", kind: "outcome" },
        { id: "yes-conc", label: "Concentration hits", kind: "outcome" },
      ],
    },
    {
      id: "hold",
      label: "Hold",
      kind: "option",
      children: [
        { id: "hold-ok", label: "Steady", kind: "outcome" },
        { id: "hold-miss", label: "Miss upside", kind: "outcome" },
      ],
    },
  ],
};
