-- Migration: Create chat_sessions table
-- Description: Chat conversation sessions for each user

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_archived ON chat_sessions(is_archived) WHERE is_archived = FALSE;

COMMENT ON TABLE chat_sessions IS 'Chat conversation sessions';
COMMENT ON COLUMN chat_sessions.user_id IS 'Owner of the chat session';
COMMENT ON COLUMN chat_sessions.title IS 'Session title (auto-generated or user-defined)';
COMMENT ON COLUMN chat_sessions.is_archived IS 'Soft delete flag for archived sessions';
