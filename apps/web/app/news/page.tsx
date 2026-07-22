"use client";

import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { NewsFeed } from "@/components/news/news-feed";

/**
 * The copy here previously promised things that do not exist: automatic
 * priority grading, an URGENT tier, and email/Telegram push. None of it was
 * built — it described the mock. A page header is a claim like any other.
 */
export default function NewsPage() {
  return (
    <WorkspaceLayout
      title="News"
      eyebrow="P029 · News Intelligence"
      description="覆盖标的的新闻监控流：按公司标记，标题与链接直达原文。只作监控信号，不作为任何数字的来源。"
    >
      <SectionHeading
        title="新闻情报流"
        description="默认只看已标记到覆盖公司的条目；可切换查看全部抓取结果，并按公司或关键词筛选。"
      />
      <NewsFeed />
    </WorkspaceLayout>
  );
}
