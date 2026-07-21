# P025 — Atlas 1.0 整合验收 · Design

> docs/design/P025-atlas-1-0-design.md · v1 草案 · 收尾模块：不加功能，只把平台变成产品

## ① 使命与决策问题

统一导航、权限、审计日志、性能预算、上线清单：**Atlas 从「一堆模块」变成「一个 1.0 产品」。**

## ② 功能清单

**v1**
- 统一导航整编：nav.ts 重排为动线顺序（Home/Watchlist/Alerts/Markets/Companies/Industries/
  Scores/Portfolio/Trading/Reports/Knowledge/Research/ERP/CEO/Board/Admin），含未启用模块的
  ComingSoon 态与权限过滤。验收：任一页面 ≤2 次点击可达；⌘K 覆盖全部实体与页面。
- 权限：`user/role`（owner/analyst/viewer）+ 模块级 ACL（组合/交易/ERP 默认仅 owner）。
  验收：viewer 登录看不到 /portfolio /trading /erp；API 侧同样拒绝（双层）。
- 审计日志：统一 `audit_log`（P028 已有的推广为平台级：登录/写操作/导出）。
- 性能预算：每路由 P95 门槛（列表 <800ms、聚合 <2s、静态 <200ms LCP 预算）+ CI 检查
  （Lighthouse CI on Pages preview）。
- 上线清单：安全（secrets 审计/只读 token）、备份（D1 export 每日→R2）、
  域名与访问控制（Cloudflare Access 前置）、监控（P024 心跳）、回滚流程。
**v2**
- 多用户邀请流；数据导出中心（我的数据一键导出）。

## ③ 后端

```
user(id PK, email, name, role 'owner'|'analyst'|'viewer', enabled)
audit_log（平台级，同 P028 结构）
```
- 认证：Cloudflare Access（Zero Trust）JWT → Worker 校验；无自建密码体系。
- `GET /v1/me` → { user, permissions }；所有写 endpoints 统一 `requireRole()` 中间件。

## ④ 前端

- AppShell 读 `/v1/me` 过滤 nav；无权限路由渲染 403 EmptyState。
- /admin：用户表、审计日志 DataTable（FilterBar: actor/action/时间）、系统状态（P024 汇总）。
- 全站验收走查：四态齐全、深浅主题、compact/comfortable、reduced-motion、打印（报告）、
  `.num` 无点零全覆盖 —— 逐路由 checklist 附于本文档附录。

## ⑤ 依赖
吃：全部模块；被吃：无。上线顺序：功能模块 v1 齐后启动。

## ⑥ 数据来源与 source.kind
无新数据；审计 derived。

## ⑦ 风险与 stop conditions
- 权限漏配 → API 双层校验 + 默认拒绝；**stop**：审计发现越权读即锁定该角色全部写权限待复核。
- 备份未验证 → 每月一次恢复演练；**stop**：演练失败暂停新模块上线直至修复。

## 附录 · 逐路由验收 checklist（模板）

| 路由 | 四态 | 深/浅 | 密度 | 动效降级 | 无点零 | 权限 | P95 |
|------|------|-------|------|----------|--------|------|-----|
| /markets | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| /portfolio | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| …（全路由） | | | | | | | |
