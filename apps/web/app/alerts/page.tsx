import { SectionHeading } from "@/components/ui/section-heading";
import { AlertList } from "@/components/alerts/alert-list";
import { MOCK_ALERTS } from "@/lib/mock/watchlist";

export default function AlertsPage() {
  return (
    <>
      <SectionHeading title="告警流" description="按时间倒序；严重度筛选与搜索见下方工具条。" />
      <AlertList alerts={MOCK_ALERTS} />
    </>
  );
}
