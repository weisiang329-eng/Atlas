-- Agent usage metering (launch hardening): one row per caller IP per day.
-- The /v1/agent/ask route increments the counter and rejects requests over
-- the daily limit (AGENT_DAILY_LIMIT, default 50) before calling Claude.
CREATE TABLE IF NOT EXISTS agent_usage (
  ip text NOT NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, day)
);
