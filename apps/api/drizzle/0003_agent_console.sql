-- Agent Console runtime (ported from the Hookka ERP agent console, adapted to
-- Postgres). Two tables:
--
--   agent_run     one row per analyst execution — status, summary, tokens, error
--   agent_control one row per analyst plus an 'ALL' row that is the global
--                 kill switch. `phase` is the governance dial:
--                   1 = propose      (agent drafts, owner acts)
--                   2 = auto-tune    (agent acts within bounds, owner reviews)
--                   3 = full-auto    (agent acts unattended)
--                 New analysts start at 1. Autonomy is granted, never assumed.

CREATE TABLE IF NOT EXISTS agent_run (
  id           text PRIMARY KEY,
  agent        text NOT NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  status       text NOT NULL DEFAULT 'running',
  request      text,
  summary      text,
  output       text,
  tokens_in    integer NOT NULL DEFAULT 0,
  tokens_out   integer NOT NULL DEFAULT 0,
  error        text
);
CREATE INDEX IF NOT EXISTS agent_run_agent_idx ON agent_run (agent, started_at DESC);

CREATE TABLE IF NOT EXISTS agent_control (
  agent      text PRIMARY KEY,
  paused     boolean NOT NULL DEFAULT false,
  phase      integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The global kill switch, plus one row per analyst, all starting at phase 1.
INSERT INTO agent_control (agent, paused, phase) VALUES
  ('ALL', false, 1),
  ('coordinator', false, 1),
  ('industry', false, 1),
  ('company', false, 1),
  ('news', false, 1),
  ('comparison', false, 1)
ON CONFLICT (agent) DO NOTHING;
