import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import { NEWS_ITEMS, CATEGORY_LABEL } from "@/lib/mock/news";

function tone(p: number): "negative" | "warning" | "info" | "neutral" {
  return p >= 5 ? "negative" : p >= 4 ? "warning" : p >= 3 ? "info" : "neutral";
}

/** Related-news panel for a company page — filters the P029 feed by ticker. */
export function RelatedNews({ ticker }: { ticker: string }) {
  const items = NEWS_ITEMS.filter((n) => n.entities.includes(ticker))
    .sort((a, b) => b.priority - a.priority || b.publishedAt - a.publishedAt)
    .slice(0, 5);

  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-muted">暂无与 {ticker} 相关的新闻。</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((n) => (
        <li key={n.id} className="flex items-start gap-3 px-1 py-3">
          <Badge tone={tone(n.priority)}>{n.priority >= 5 ? "URGENT" : CATEGORY_LABEL[n.category]}</Badge>
          <div className="min-w-0 flex-1">
            <a href={n.url} className="text-sm text-fg hover:text-accent">{n.title}</a>
            <p className="mt-0.5 text-2xs text-faint">{n.source} · {formatRelative(n.publishedAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
