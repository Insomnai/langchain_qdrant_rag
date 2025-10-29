-- Migration: Create user_sessions table
-- Description: Authentication sessions for logged-in users

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS 'Active authentication sessions';
COMMENT ON COLUMN user_sessions.token_hash IS 'Hashed session token (never store plain tokens)';
COMMENT ON COLUMN user_sessions.expires_at IS 'Session expiration timestamp';
COMMENT ON COLUMN user_sessions.user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN user_sessions.ip_address IS 'IP address of the client';
