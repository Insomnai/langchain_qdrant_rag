-- Migration: Create helper functions and triggers
-- Description: Database functions for automation

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates updated_at column on row update';

-- Trigger: Auto-update users.updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update chat_sessions.updated_at
CREATE TRIGGER update_chat_sessions_updated_at 
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_sessions IS 'Deletes expired user sessions, returns count of deleted rows';

-- Function: Update chat session timestamp when message added
CREATE OR REPLACE FUNCTION update_chat_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions 
  SET updated_at = NEW.created_at 
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_chat_session_on_message IS 'Updates chat session timestamp when new message is added';

-- Trigger: Update session on new message
CREATE TRIGGER update_session_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_on_message();

-- Function: Increment document chunk count
CREATE OR REPLACE FUNCTION increment_document_chunk_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE documents 
  SET chunk_count = chunk_count + 1
  WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_document_chunk_count IS 'Increments chunk_count when new chunk is added';

-- Trigger: Auto-increment chunk count
CREATE TRIGGER increment_chunk_count
  AFTER INSERT ON document_chunks
  FOR EACH ROW
  EXECUTE FUNCTION increment_document_chunk_count();
