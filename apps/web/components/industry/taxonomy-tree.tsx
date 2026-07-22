"use client";

/**
 * The industry taxonomy, as a tree.
 *
 * Why a tree at all: drivers hang off DRIVER-HOMOGENEOUS leaves. HBM is bound
 * to AI capex and CoWoS allocation while commodity DRAM follows phone and PC
 * demand, so a single "Memory" row cannot carry either one's drivers — the
 * split is the model, not decoration (docs/INDUSTRY-INTELLIGENCE.md §1).
 *
 * Two rules this component exists to keep:
 *
 * - **Never print the level number.** `L4 细分` leaks the schema, and depth is
 *   uneven by design, so a visible number invites "why does this branch have
 *   an extra level" — a question whose honest answer is an implementation
 *   detail. Indentation says it better.
 * - **Show empty leaves.** A sub-industry with no company filed on it yet
 *   reads `0`, because the taxonomy's job includes stating where coverage is
 *   missing. Hiding those nodes would make coverage look complete.
 */
import Link from "next/link";
import { DataState } from "@/components/ui/data-state";
import { useApiResource } from "@/lib/loaders/use-api";
import { useLocale } from "@/lib/i18n/use-locale";
import type { TaxonomyTree as TaxonomyTreePayload, TaxonomyTreeNode } from "@/lib/types";

function Node({
  node,
  depth,
  zh,
}: {
  node: TaxonomyTreeNode;
  depth: number;
  zh: boolean;
}) {
  const label = zh ? (node.nameZh ?? node.name) : node.name;
  return (
    <li>
      <div
        className="flex items-baseline gap-2 py-1"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <Link
          href={`/industries/${node.id}`}
          className={
            depth === 0
              ? "text-sm font-medium text-fg hover:text-accent"
              : "text-sm text-muted hover:text-accent"
          }
        >
          {label}
        </Link>
        <span className="num text-2xs text-faint">
          {node.companyCount}
          {node.directCompanyCount > 0 && node.children.length > 0
            ? ` (${node.directCompanyCount} ${zh ? "直接" : "direct"})`
            : ""}
        </span>
      </div>
      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <Node key={child.id} node={child} depth={depth + 1} zh={zh} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function TaxonomyTree() {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const r = useApiResource<TaxonomyTreePayload>("/v1/industries/tree");

  return (
    <DataState status={r.status}>
      <ul className="flex flex-col">
        {(r.data?.roots ?? []).map((root) => (
          <Node key={root.id} node={root} depth={0} zh={zh} />
        ))}
      </ul>
      <p className="mt-3 text-2xs text-faint">
        {zh
          ? "数字为该节点及其下所有公司数。细分行业尚未归属公司 — 归属需要逐家判断（Micron 同时做 DRAM/NAND/HBM），留待人工审定。"
          : "Counts include everything below a node. Sub-industries hold no companies yet — re-filing is a judgement call (Micron makes DRAM, NAND and HBM) and is left for review."}
      </p>
    </DataState>
  );
}
