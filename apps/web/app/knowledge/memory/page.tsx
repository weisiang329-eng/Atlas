"use client";

import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { MEMORIES } from "@/lib/mock/learning";

const TONE = { conclusion: "accent", profile: "info", fact: "neutral" } as const;
const LABEL = { conclusion: "结论", profile: "画像", fact: "事实" } as const;

export default function MemoryPage() {
  return (
    <WorkspaceLayout title="Memory" eyebrow="P021 · Memory Engine" description="研究结论与实体画像的长期记忆（D1 + Vectorize），供 agent 与语义搜索使用。只索引定稿内容。">
      <SectionHeading title="Atlas 记得" description="定稿研究笔记与决策复盘自动沉淀为记忆条目；每条带出处。" />
      <ul className="flex flex-col gap-3">
        {MEMORIES.map((m) => (
          <li key={m.id} className="rounded-panel border border-border bg-surface p-4 shadow-panel">
            <div className="flex items-center gap-2">
              <Badge tone={TONE[m.kind]}>{LABEL[m.kind]}</Badge>
              <span className="font-mono text-2xs text-faint">{m.entity}</span>
              <span className="ml-auto text-2xs text-faint">{formatRelative(m.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-fg">{m.text}</p>
            <p className="mt-2 text-2xs text-faint">出处 · {m.origin}</p>
          </li>
        ))}
      </ul>
    </WorkspaceLayout>
  );
}
