-- 0007 — the industry taxonomy becomes a tree.
--
-- Design: docs/INDUSTRY-INTELLIGENCE.md §1. Drivers hang off leaves, and a
-- leaf is only a leaf when its drivers are homogeneous — HBM is bound to AI
-- capex and CoWoS allocation while commodity DRAM follows phone and PC
-- demand, so a single "Memory" node cannot carry either one's drivers.
--
-- This migration carries reference data as well as schema, like 0005: the
-- Worker applies its own migrations on a cold start, so production picks the
-- taxonomy up without anyone pasting SQL into a dashboard. Every statement is
-- idempotent for the same reason.
--
-- `level` is depth, 1 at the root. It is schema vocabulary; the UI renders the
-- breadcrumb (科技 › 半导体 › 存储 › DRAM) and never the number.

ALTER TABLE industry ADD COLUMN IF NOT EXISTS name_zh text;
ALTER TABLE industry ADD COLUMN IF NOT EXISTS parent_id text;
ALTER TABLE industry ADD COLUMN IF NOT EXISTS level integer;

-- Self-referencing FK, added defensively: a taxonomy whose parent ids can
-- dangle is a taxonomy that will eventually render an orphan branch.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'industry_parent_id_fk'
  ) THEN
    ALTER TABLE industry
      ADD CONSTRAINT industry_parent_id_fk
      FOREIGN KEY (parent_id) REFERENCES industry(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS industry_parent_idx ON industry (parent_id);

-- ── roots ───────────────────────────────────────────────────────────────────
INSERT INTO industry (id, name, name_zh, sector, parent_id, level) VALUES
  ('sector-technology', 'Technology', '科技', 'Technology', NULL, 1),
  ('sector-healthcare', 'Healthcare', '医疗保健', 'Healthcare', NULL, 1)
ON CONFLICT (id) DO UPDATE SET name_zh = EXCLUDED.name_zh, parent_id = EXCLUDED.parent_id, level = EXCLUDED.level;

-- ── chain segments ──────────────────────────────────────────────────────────
INSERT INTO industry (id, name, name_zh, sector, parent_id, level) VALUES
  ('chain-semiconductors', 'Semiconductors', '半导体', 'Semiconductors', 'sector-technology', 2),
  ('chain-ai-infrastructure', 'AI Infrastructure', 'AI 基础设施', 'AI Infrastructure', 'sector-technology', 2),
  ('chain-medical-consumables', 'Medical Consumables', '医疗耗材', 'Healthcare Manufacturing', 'sector-healthcare', 2)
ON CONFLICT (id) DO UPDATE SET name_zh = EXCLUDED.name_zh, parent_id = EXCLUDED.parent_id, level = EXCLUDED.level;

-- ── the seven that already existed, placed on the tree ──────────────────────
-- Written as INSERT ... ON CONFLICT because this migration must also work on a
-- FRESH database, where it runs before the seeds: the sub-industries below
-- carry a foreign key to these ids, so they have to exist first. On the
-- deployed database the rows are already there and only the three taxonomy
-- columns are touched — name, sector and description are left alone, since the
-- seed owns those.
INSERT INTO industry (id, name, name_zh, sector, parent_id, level) VALUES
  ('semis-equipment', 'Semiconductor Equipment', '半导体设备', 'Semiconductors', 'chain-semiconductors', 3),
  ('semis-foundry', 'Foundry & IDM', '代工', 'Semiconductors', 'chain-semiconductors', 3),
  ('semis-memory', 'Memory (HBM / DRAM / NAND)', '存储', 'Semiconductors', 'chain-semiconductors', 3),
  ('semis-accelerators', 'AI Accelerators & GPUs', 'AI 加速器', 'Semiconductors', 'chain-semiconductors', 3),
  ('networking', 'Networking & Custom ASIC', '网络 / ASIC', 'AI Infrastructure', 'chain-ai-infrastructure', 3),
  ('dc-power-cooling', 'Data Center Power & Cooling', '数据中心电力与散热', 'AI Infrastructure', 'chain-ai-infrastructure', 3),
  ('rubber-gloves', 'Rubber & Medical Gloves', '手套', 'Healthcare Manufacturing', 'chain-medical-consumables', 3)
ON CONFLICT (id) DO UPDATE SET name_zh = EXCLUDED.name_zh, parent_id = EXCLUDED.parent_id, level = EXCLUDED.level;

-- ── sub-industries: split ONLY where the drivers diverge ────────────────────
-- Memory splits three ways; foundry splits by node maturity (advanced follows
-- customer capex, mature follows automotive/industrial inventory — frequently
-- out of phase); equipment splits front-end from back-end; gloves split by
-- feedstock (NBR tracks oil → butadiene, NR tracks a crop).
-- AI accelerators, networking and data-centre power are NOT split: one driver
-- set covers each today, and another level is another level to maintain.
INSERT INTO industry (id, name, name_zh, sector, parent_id, level) VALUES
  ('memory-dram', 'DRAM', 'DRAM', 'Semiconductors', 'semis-memory', 4),
  ('memory-nand', 'NAND', 'NAND', 'Semiconductors', 'semis-memory', 4),
  ('memory-hbm', 'HBM', 'HBM', 'Semiconductors', 'semis-memory', 4),
  ('foundry-advanced', 'Advanced Node Foundry', '先进制程代工', 'Semiconductors', 'semis-foundry', 4),
  ('foundry-mature', 'Mature Node Foundry', '成熟制程代工', 'Semiconductors', 'semis-foundry', 4),
  ('equipment-frontend', 'Front-End Equipment', '前道设备', 'Semiconductors', 'semis-equipment', 4),
  ('equipment-backend', 'Back-End Equipment', '后道封测设备', 'Semiconductors', 'semis-equipment', 4),
  ('gloves-nitrile', 'Nitrile Gloves', '丁腈手套', 'Healthcare Manufacturing', 'rubber-gloves', 4),
  ('gloves-natural', 'Natural Rubber Gloves', '天然胶手套', 'Healthcare Manufacturing', 'rubber-gloves', 4)
ON CONFLICT (id) DO UPDATE SET name_zh = EXCLUDED.name_zh, parent_id = EXCLUDED.parent_id, level = EXCLUDED.level;
