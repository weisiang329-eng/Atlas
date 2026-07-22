export interface GlossaryTerm {
  term: string;
  zh: string;
  def: string;
}

export interface RosterRow {
  ticker: string;
  subIndustry: string;
  role: string;
}

export interface IndustryPrimerData {
  what: string;
  glossary: GlossaryTerm[];
  roster: RosterRow[];
}

/**
 * Industry primer copy — P006 addition: "what is this industry, what are the
 * key terms, who's in it and what do they do". Educational scaffold sitting
 * above the value chain / cost factor / compare sections. Sample copy —
 * replace with vetted research copy when real industry write-ups land.
 */
export const AI_INFRA_PRIMER: IndustryPrimerData = {
  what:
    "AI 基建（AI Infrastructure）是支撑 AI 模型训练与推理的整套物理与计算栈：设计芯片的公司、" +
    "代工制造芯片的晶圆厂、给芯片配套的高速存储、把成千上万块芯片连成一台「超级计算机」的网络设备，" +
    "以及让这一切在数据中心里不过热、不断电地跑起来的电力与冷却系统。这条链子里任何一环缺货或涨价，" +
    "都会传导到下游云厂商的 AI 算力成本，最终影响谁能训练出更强的模型。",
  glossary: [
    { term: "Chip / 芯片", zh: "芯片", def: "执行计算的半导体器件；这里特指用于 AI 训练/推理的运算芯片。" },
    { term: "GPU", zh: "图形处理器", def: "最初为图形渲染设计，因擅长并行计算成为 AI 训练的主力芯片。" },
    { term: "AI ASIC", zh: "专用 AI 芯片", def: "为特定 AI 任务定制的芯片（而非通用 GPU），通常能效更高但灵活性更低。" },
    { term: "Foundry / IDM", zh: "晶圆代工 / 垂直整合制造", def: "Foundry 只代工别人设计的芯片；IDM 自己设计也自己制造。" },
    { term: "HBM", zh: "高带宽存储", def: "堆叠封装在芯片旁边的高速内存，专门喂数据给 AI 芯片，是当前最紧俏的存储类型。" },
    { term: "Networking & Custom ASIC", zh: "网络与定制芯片", def: "把大量芯片互连成集群的交换机/网卡，以及云厂商自研的专用芯片。" },
    { term: "DC Power & Cooling", zh: "数据中心电力与冷却", def: "液冷、配电、UPS 等——AI 数据中心单机柜功耗暴涨后的新增瓶颈环节。" },
  ],
  roster: [
    { ticker: "HLXC", subIndustry: "AI Accelerators & GPUs", role: "设计并销售 AI 训练/推理用 GPU，行业需求增速的风向标。" },
    { ticker: "ARFY", subIndustry: "Foundry & IDM", role: "为 HLXC 等无厂设计公司代工先进制程芯片。" },
    { ticker: "VTXM", subIndustry: "Memory", role: "生产 HBM/DRAM，供给周期直接决定 AI 服务器的成本与产能。" },
    { ticker: "NMBS", subIndustry: "Networking & Custom ASIC", role: "提供集群互连网络设备，并为云厂商设计定制 ASIC。" },
    { ticker: "SLPW", subIndustry: "DC Power & Cooling", role: "数据中心液冷与电力设备，AI 机柜功耗上升的直接受益者。" },
  ],
};

export const GLOVE_PRIMER: IndustryPrimerData = {
  what:
    "医用/工业手套行业的核心是「用胶乳做手套」这门生意：上游是丁腈胶乳（NBR）或天然胶乳等原材料，" +
    "中游是浸渍生产线把胶乳做成一次性手套，下游经分销商卖给医院、诊所与工业客户。行业是典型的大宗商品" +
    "成本驱动型制造业——原料价格、天然气（生产用能）、汇率（大马产能出口全球）共同决定毛利率，" +
    "疫情期间的暴利与之后的产能过剩、价格战都源于此。",
  glossary: [
    { term: "NBR", zh: "丁腈胶乳", def: "合成胶乳原料，价格随原油/丁二烯波动，是手套最大的可变成本。" },
    { term: "ASP", zh: "平均售价", def: "Average Selling Price，手套出厂平均单价，是判断景气度最直接的指标。" },
    { term: "MARGMA", zh: "大马橡胶手套制造商公会", def: "行业协会，发布 ASP、产能等行业统计数据的主要来源。" },
    { term: "稼动率 Utilization", zh: "产能利用率", def: "实际产量 / 设计产能，反映需求相对供给的松紧。" },
    { term: "Dipping Line", zh: "浸渍生产线", def: "把胶乳模具浸入槽中反复成型、硫化、脱模制成手套的核心生产设备。" },
  ],
  roster: [
    { ticker: "MRGV", subIndustry: "Rubber & Medical Gloves", role: "大马主要手套制造商之一，产能与稼动率是核心跟踪指标。" },
  ],
};
