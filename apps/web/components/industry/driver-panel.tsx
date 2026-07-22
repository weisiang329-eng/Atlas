"use client";

/**
 * What moves this industry — each claim shown next to its backtest.
 *
 * The layout is deliberate: the CLAIM (phase, lag, elasticity, who it hits)
 * sits above the VERDICT, and the verdict is never omitted. A driver panel
 * that showed only claims would read as knowledge whether or not anything
 * behind it was ever checked, which is the failure
 * docs/INDUSTRY-INTELLIGENCE.md §5 is written against: "a driver whose stated
 * relationship never held is a driver to remove, not to keep."
 *
 * So a contradicted claim is rendered in red and kept on screen. Deleting it
 * quietly would erase the finding; the finding IS the product.
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";
import { useApiResource } from "@/lib/loaders/use-api";
import { useLocale } from "@/lib/i18n/use-locale";
import { MISSING } from "@/lib/format";
import type {
  DriverVerdict,
  IndustryDriver,
  IndustryDrivers,
} from "@/lib/types";

const VERDICT_TONE: Record<DriverVerdict, "positive" | "warning" | "negative" | "neutral"> = {
  holds: "positive",
  weak: "warning",
  contradicted: "negative",
  "insufficient-data": "neutral",
};

const VERDICT_LABEL: Record<DriverVerdict, { zh: string; en: string }> = {
  holds: { zh: "数据支持", en: "holds" },
  weak: { zh: "关系微弱", en: "weak" },
  contradicted: { zh: "与数据相反", en: "contradicted" },
  "insufficient-data": { zh: "未验证", en: "untested" },
};

const PHASE_LABEL: Record<string, { zh: string; en: string }> = {
  leading: { zh: "领先", en: "leading" },
  coincident: { zh: "同步", en: "coincident" },
  lagging: { zh: "滞后", en: "lagging" },
};

/**
 * "Driver ↑ → (channel) → margin ↓, one quarter later, 3–4 points."
 *
 * `direction` is the sign of the MARGIN response, and `affects` is the channel
 * it travels through — so the two must not be joined directly. The first
 * version rendered "NBR latex ↑ → COGS ↓", which states the opposite of the
 * claim: rising feedstock raises COGS, and it is the margin that falls.
 */
function claimSentence(d: IndustryDriver, zh: boolean): string {
  const dir = d.direction < 0 ? "↓" : "↑";
  const band =
    d.elasticityLow !== null && d.elasticityHigh !== null
      ? ` ${d.elasticityLow}~${d.elasticityHigh}${d.elasticityUnit ? ` ${d.elasticityUnit}` : ""}`
      : "";
  const lag =
    d.lagQuarters === 0
      ? zh ? "同季" : "same quarter"
      : zh ? `滞后 ${d.lagQuarters} 季` : `${d.lagQuarters}q later`;
  const channel = d.affects ? `${d.affects} → ` : "";
  return zh
    ? `${d.nameZh ?? d.name} ↑ → ${channel}利润率 ${dir}（${lag}）${band}`
    : `${d.name} ↑ → ${channel}margin ${dir} (${lag})${band}`;
}

function DriverCard({ d, zh }: { d: IndustryDriver; zh: boolean }) {
  const b = d.backtest;
  const verdict = VERDICT_LABEL[b.verdict];

  return (
    <li className="rounded-panel border border-border bg-surface p-4 shadow-panel">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        {/* Drivers hang off the leaf whose drivers they are, but the companies
            sit higher up — so a parent shows its children's drivers, labelled
            with where they belong rather than silently absorbed. */}
        {d.inherited ? (
          <Link
            href={`/industries/${d.nodeId}`}
            className="rounded-pill border border-border px-2 py-0.5 font-mono text-2xs text-faint hover:text-accent"
          >
            {zh ? (d.nodeNameZh ?? d.nodeName) : d.nodeName}
          </Link>
        ) : null}
        <span className="text-sm font-medium text-fg">{zh ? (d.nameZh ?? d.name) : d.name}</span>
        <Badge tone="neutral">{(PHASE_LABEL[d.phase] ?? PHASE_LABEL.coincident!)[zh ? "zh" : "en"]}</Badge>
        <Badge tone={VERDICT_TONE[b.verdict]}>{verdict[zh ? "zh" : "en"]}</Badge>
        {/* A claim is an assumption until a backtest supports it, and the
            promotion to `fact` is a deliberate act. Say which this is. */}
        {d.kind === "assumption" ? (
          <Badge tone="warning">{zh ? "假设" : "assumption"}</Badge>
        ) : null}
        {/* A derived series is a SUBSTITUTE, and the badge is the first half
            of saying so; `measures` below is the half that matters. */}
        {d.seriesOrigin === "derived" ? (
          <Badge tone="info">{zh ? "由财报推算" : "derived"}</Badge>
        ) : null}
      </div>

      {d.whatItIs ? (
        <p className="mb-2 text-2xs leading-relaxed text-muted">{d.whatItIs}</p>
      ) : null}

      <p className="mb-2 font-mono text-2xs text-fg">{claimSentence(d, zh)}</p>

      {b.verdict === "insufficient-data" ? (
        <p className="text-2xs text-faint">
          {d.hasSeries
            ? zh
              ? `样本不足，无法给出结论（可用观测 ${b.n} 季）。`
              : `Not enough overlapping quarters to answer (${b.n}).`
            : zh
              ? `尚无数据序列 — ${d.sourceName ?? "来源未接入"}。`
              : `No series ingested yet — ${d.sourceName ?? "source not connected"}.`}
        </p>
      ) : (
        <div className="flex flex-col gap-1 text-2xs text-muted">
          <p>
            {zh ? "实测" : "Measured"}{" "}
            <span className="num text-fg">
              {b.impliedElasticity === null ? MISSING : b.impliedElasticity}
            </span>{" "}
            {zh ? "点 / 驱动 +10%" : "pp per +10%"}
            {b.controlledFor.length > 0 ? (
              <span className="text-faint">
                {zh
                  ? `（已控制 ${b.controlledFor.join("、")}）`
                  : ` (holding ${b.controlledFor.join(", ")} fixed)`}
              </span>
            ) : null}
          </p>
          <p className="text-faint">
            n={b.n} · R²={b.r2 ?? MISSING} · {b.sampleFrom}–{b.sampleTo}
          </p>
          {/* Naming the proxy is the difference between a substitute and a
              swap nobody was told about. */}
          {b.isProxy && b.proxyNote ? (
            <p className="text-warning">{b.proxyNote}</p>
          ) : null}
          {/* The same rule for the input side: a computed stand-in must say
              what it is, or it quietly becomes the thing it replaced. */}
          {d.derivedMeasures ? (
            <p className="text-info">
              {d.derivedMeasures}
              {d.derivedFromCompanies.length > 0 ? (
                <span className="text-faint">
                  {zh ? " 计算自：" : " Computed from: "}
                  {d.derivedFromCompanies.join(", ")}
                </span>
              ) : null}
            </p>
          ) : null}
          {d.lagProfile.length > 0 ? (
            <p className="text-faint">
              {zh ? "滞后诊断（非结论）：" : "Lag profile (diagnostic, not a verdict): "}
              {d.lagProfile
                .map((p) => `${p.lagQuarters}q ${p.impliedElasticity ?? MISSING}`)
                .join(" · ")}
            </p>
          ) : null}
        </div>
      )}

      {d.whoItHits ? (
        <p className="mt-2 text-2xs text-faint">
          {zh ? "打击谁：" : "Who it hits: "}
          {d.whoItHits}
        </p>
      ) : null}
      {d.sourceName ? (
        <p className="mt-1 text-2xs text-faint">
          {zh ? "来源：" : "Source: "}
          {d.sourceUrl ? (
            <a href={d.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">
              {d.sourceName} ↗
            </a>
          ) : (
            d.sourceName
          )}
        </p>
      ) : null}
    </li>
  );
}

export function DriverPanel({ industryId }: { industryId: string }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const r = useApiResource<IndustryDrivers>(`/v1/industries/${industryId}/drivers`);
  const drivers = r.data?.drivers ?? [];

  if (r.status === "ready" && drivers.length === 0) {
    // An empty driver list is the work list, not an error.
    return (
      <p className="rounded-panel border border-border bg-surface px-4 py-6 text-center text-2xs text-faint">
        {zh
          ? "这个行业还没有登记驱动因素。驱动因素挂在叶子节点上，每条都要写明相位、滞后与弹性，才能被回测。"
          : "No drivers recorded for this industry yet. Drivers hang off leaves and each states a phase, a lag and an elasticity so it can be backtested."}
      </p>
    );
  }

  return (
    <DataState status={r.status}>
      <ul className="flex flex-col gap-2">
        {drivers.map((d) => (
          <DriverCard key={d.key} d={d} zh={zh} />
        ))}
      </ul>
      {r.data?.target ? (
        <p className="mt-3 text-2xs text-faint">
          {zh
            ? `全部回测针对：${r.data.target.label}（${r.data.target.points.length} 个季度，按营收加权，共 ${r.data.target.companies.length} 家）。回归用的是变化率而非水平值 —— 两条同时上行的曲线在水平值上必然高度相关，却说明不了任何因果。`
            : `Every backtest runs against ${r.data.target.label} (${r.data.target.points.length} quarters, revenue-weighted across ${r.data.target.companies.length} companies). The regression is on changes, not levels — two series that both trend correlate at 0.9 in levels and mean nothing.`}
          {/* A borrowed target is a weaker claim than an own one, and the
              reader is the one who has to know that. */}
          {r.data.target.borrowed ? (
            <span className="text-warning">
              {zh
                ? ` 注意：这个节点还没有归属公司，利润率历史借用的是「${r.data.target.fromNodeName}」。`
                : ` Note: no company is filed on this node, so the margin history is borrowed from ${r.data.target.fromNodeName}.`}
            </span>
          ) : null}
        </p>
      ) : null}
    </DataState>
  );
}
