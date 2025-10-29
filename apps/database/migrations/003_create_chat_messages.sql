-- Migration: Create chat_messages table
-- Description: Individual messages within chat sessions

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tokens_used INTEGER,
  model VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

COMMENT ON TABLE chat_messages IS 'Individual messages in chat conversations';
COMMENT ON COLUMN chat_messages.role IS 'Message sender: user, assistant, or system';
COMMENT ON COLUMN chat_messages.content IS 'Message text content';
COMMENT ON COLUMN chat_messages.tokens_used IS 'OpenAI tokens consumed by this message';
COMMENT ON COLUMN chat_messages.model IS 'AI model used (e.g., gpt-3.5-turbo)';
