/**
 * MOCK news intelligence data — P029 v1 UI scaffold. Fictional headlines about
 * the fictional watchlist entities (never real quotes/claims about real firms).
 * Replace with crawled news_item rows once the P029/P022 pipeline lands.
 * Copyright: store title + summary + link only.
 */
export type NewsCategory = "earnings" | "mna" | "regulation" | "supply-chain" | "macro" | "product";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  country: string;
  category: NewsCategory;
  priority: 1 | 2 | 3 | 4 | 5; // 5 = urgent
  entities: string[]; // tickers
  publishedAt: number;
  url: string;
}

const h = 3600e3;
export const NEWS_ITEMS: NewsItem[] = [
  { id: "n1", title: "Helios Compute 下季度指引超预期，数据中心订单积压创高", summary: "公司上调全年营收指引，管理层称 AI 训练需求「未见放缓」。", source: "Reuters (mock)", country: "US", category: "earnings", priority: 5, entities: ["HLXC"], publishedAt: Date.now() - 0.5 * h, url: "#" },
  { id: "n2", title: "监管机构就先进制程出口新规征求意见", summary: "拟议规则可能影响 Foundry 产能分配，行业静待细则。", source: "Bloomberg (mock)", country: "US", category: "regulation", priority: 5, entities: ["ARFY", "HLXC"], publishedAt: Date.now() - 1.5 * h, url: "#" },
  { id: "n3", title: "Vertex Memory 传下调 HBM 报价以抢占份额", summary: "价格战担忧升温，存储板块承压。", source: "DigiTimes (mock)", country: "TW", category: "supply-chain", priority: 4, entities: ["VTXM"], publishedAt: Date.now() - 4 * h, url: "#" },
  { id: "n4", title: "Nimbus Networks 发布新一代 800G 交换芯片", summary: "面向 AI 集群互连，量产预计下半年。", source: "Company IR (mock)", country: "US", category: "product", priority: 3, entities: ["NMBS"], publishedAt: Date.now() - 20 * h, url: "#" },
  { id: "n5", title: "马来西亚手套业协会：ASP 环比首次转正", summary: "行业协会数据显示价格企稳，稼动率小幅回升。", source: "MARGMA (mock)", country: "MY", category: "macro", priority: 3, entities: ["MRGV"], publishedAt: Date.now() - 30 * h, url: "#" },
  { id: "n6", title: "美联储会议纪要：利率路径维持谨慎", summary: "宏观流动性预期影响成长股估值。", source: "Reuters (mock)", country: "US", category: "macro", priority: 2, entities: [], publishedAt: Date.now() - 46 * h, url: "#" },
];

export const CATEGORY_LABEL: Record<NewsCategory, string> = {
  earnings: "财报", mna: "并购", regulation: "监管", "supply-chain": "供应链", macro: "宏观", product: "产品",
};
