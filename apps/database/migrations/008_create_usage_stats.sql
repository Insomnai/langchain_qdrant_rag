-- Migration: Create usage_stats table
-- Description: Daily usage statistics per user

CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  documents_uploaded INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON usage_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON usage_stats(date DESC);

COMMENT ON TABLE usage_stats IS 'Daily aggregated usage statistics per user';
COMMENT ON COLUMN usage_stats.date IS 'Date for this usage record';
COMMENT ON COLUMN usage_stats.messages_sent IS 'Number of chat messages sent this day';
COMMENT ON COLUMN usage_stats.documents_uploaded IS 'Number of documents uploaded this day';
COMMENT ON COLUMN usage_stats.tokens_used IS 'Total OpenAI tokens consumed this day';
