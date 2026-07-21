import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { NewsFeed } from "@/components/news/news-feed";

export default function NewsPage() {
  return (
    <WorkspaceLayout
      title="News"
      eyebrow="P029 · News Intelligence"
      description="全球新闻 + 持仓股票新闻，自动打标签分级；最高评级(URGENT)直接推送。示例数据。"
    >
      <SectionHeading title="新闻情报流" description="按类别 / 国家 / 优先级筛选与搜索；URGENT 置顶并已推送邮件/Telegram。" />
      <NewsFeed />
    </WorkspaceLayout>
  );
}
