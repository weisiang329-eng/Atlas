import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/section-heading";
import { PlannedModule } from "@/components/ui/planned-module";

export const metadata: Metadata = { title: "Memory" };

/**
 * P021 (agent long-term memory) is not built. This page used to render
 * `MEMORIES` from lib/mock/learning under the heading "Atlas 记得", with a
 * per-item 出处 line — fabricated research conclusions attributed to real
 * companies, each carrying a fake source. That is precisely what convention
 * #1 forbids, and it is worse than a fake table: a reader has no way to tell
 * an invented "conclusion" from one the platform actually derived, and the
 * source line actively argues that it did.
 *
 * The old copy also claimed "D1 + Vectorize", left over from the pre-Supabase
 * stack. Postgres + pgvector is the plan of record (CLAUDE.md, HANDOFF §13.4).
 */
export default function MemoryPage() {
  return (
    <>
      <SectionHeading
        title="Atlas 记得"
        description="定稿的研究笔记与决策复盘会沉淀为长期记忆，供 agent 检索。尚未构建。"
      />
      <PlannedModule
        title="长期记忆 · Long-term memory (P021)"
        body="定稿研究笔记与实体画像的语义索引，让 agent 能回忆起过去研究过什么、结论是什么、依据是什么 —— 而不是每次从零开始。只索引定稿内容，每条记忆保留可点击的原始出处。"
        fields={[
          "记忆条目（结论 / 画像 / 事实）",
          "所属实体",
          "原始出处链接",
          "沉淀时间",
          "语义相似度检索",
        ]}
        requires="Supabase pgvector extension + an embedding pipeline over research notes and decision reviews, plus a semantic-search tool exposed to the agent runtime. Nothing is stored yet."
        program="P021"
      />
    </>
  );
}
