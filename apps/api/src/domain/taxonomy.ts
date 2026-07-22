/**
 * The industry taxonomy as a tree — paths, descendants, and roll-up.
 *
 * Design: `docs/INDUSTRY-INTELLIGENCE.md` §1. Two properties of that design
 * drive everything here:
 *
 * 1. **Depth is uneven**, because a branch stops as soon as it is
 *    driver-homogeneous. Nothing may assume a fixed number of levels.
 * 2. **`level` is schema vocabulary.** These functions return NAMES and paths;
 *    the number never leaves the database except as an ordering aid.
 *
 * Roll-up exists because companies are filed on one node while a reader asks
 * questions at every node. "How is 半导体 doing" must aggregate the companies
 * under 存储, 代工 and 设备, or the parent renders as empty while its children
 * hold the entire universe.
 */

/** The subset of an `industry` row this module needs. */
export interface TaxonomyRow {
  id: string;
  name: string;
  nameZh: string | null;
  parentId: string | null;
  level: number | null;
}

export interface TaxonomyNode extends TaxonomyRow {
  children: TaxonomyNode[];
  /** Root → this node, inclusive. The breadcrumb, in order. */
  path: TaxonomyRow[];
}

/**
 * Depth cap. A cycle in the parent chain would otherwise hang the Worker, and
 * a 20-deep taxonomy is a mistake long before it is a feature.
 */
const MAX_DEPTH = 20;

/** Root → node, inclusive. Stops safely if the parent chain is broken. */
export function pathOf(rows: TaxonomyRow[], id: string): TaxonomyRow[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: TaxonomyRow[] = [];
  let cursor = byId.get(id);
  const seen = new Set<string>();

  while (cursor && out.length < MAX_DEPTH) {
    if (seen.has(cursor.id)) break; // cycle — return what is safe
    seen.add(cursor.id);
    out.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return out;
}

/** The node and everything beneath it. Includes `id` itself. */
export function descendantIds(rows: TaxonomyRow[], id: string): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const r of rows) {
    if (!r.parentId) continue;
    const list = childrenOf.get(r.parentId) ?? [];
    list.push(r.id);
    childrenOf.set(r.parentId, list);
  }

  const out = new Set<string>([id]);
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of childrenOf.get(current) ?? []) {
      if (out.has(child)) continue; // cycle guard
      out.add(child);
      queue.push(child);
    }
  }
  return out;
}

/** The whole forest, each node carrying its children and its breadcrumb. */
export function buildTaxonomy(rows: TaxonomyRow[]): TaxonomyNode[] {
  const byId = new Map<string, TaxonomyNode>(
    rows.map((r) => [r.id, { ...r, children: [], path: pathOf(rows, r.id) }]),
  );

  const roots: TaxonomyNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    // A node whose parent id does not resolve is treated as a root rather than
    // dropped: losing an industry silently is worse than showing it unplaced.
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  }

  const sort = (nodes: TaxonomyNode[]): TaxonomyNode[] => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const n of nodes) sort(n.children);
    return nodes;
  };
  return sort(roots);
}

/**
 * Company ids per node, INCLUDING descendants.
 *
 * A company is filed on exactly one node (a leaf, per the design), so a
 * parent's membership is entirely inherited. Returned as ids so the caller
 * decides what to compute from them — this module knows nothing about scores.
 */
export function rollUpMembers(
  rows: TaxonomyRow[],
  companies: { id: string; industryId: string | null }[],
): Map<string, string[]> {
  const direct = new Map<string, string[]>();
  for (const co of companies) {
    if (!co.industryId) continue;
    const list = direct.get(co.industryId) ?? [];
    list.push(co.id);
    direct.set(co.industryId, list);
  }

  const out = new Map<string, string[]>();
  for (const r of rows) {
    const ids: string[] = [];
    for (const nodeId of descendantIds(rows, r.id)) {
      ids.push(...(direct.get(nodeId) ?? []));
    }
    out.set(r.id, ids);
  }
  return out;
}
