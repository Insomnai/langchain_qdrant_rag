-- Migration: Create helpful views
-- Description: Views for common queries

-- View: Recent chats with message counts
CREATE OR REPLACE VIEW user_recent_chats AS
SELECT 
  cs.id AS session_id,
  cs.user_id,
  cs.title,
  cs.created_at,
  cs.updated_at,
  cs.is_archived,
  COUNT(DISTINCT cm.id) AS message_count,
  MAX(cm.created_at) AS last_message_at
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
GROUP BY cs.id, cs.user_id, cs.title, cs.created_at, cs.updated_at, cs.is_archived
ORDER BY cs.updated_at DESC;

COMMENT ON VIEW user_recent_chats IS 'Recent chat sessions with message counts';

-- View: Document statistics with citation counts
CREATE OR REPLACE VIEW document_stats AS
SELECT 
  d.id AS document_id,
  d.user_id,
  d.filename,
  d.file_size,
  d.upload_date,
  d.chunk_count,
  d.is_processed,
  COUNT(DISTINCT cms.message_id) AS times_cited,
  AVG(cms.relevance_score) AS avg_relevance_score,
  MAX(cms.created_at) AS last_used_at
FROM documents d
LEFT JOIN document_chunks dc ON d.id = dc.document_id
LEFT JOIN chat_message_sources cms ON dc.id = cms.document_chunk_id
GROUP BY d.id, d.user_id, d.filename, d.file_size, d.upload_date, d.chunk_count, d.is_processed;

COMMENT ON VIEW document_stats IS 'Document statistics including citation counts';

-- View: User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.id AS user_id,
  u.username,
  u.email,
  u.created_at AS user_since,
  u.last_login,
  COUNT(DISTINCT cs.id) AS total_chat_sessions,
  COUNT(DISTINCT cm.id) AS total_messages,
  COUNT(DISTINCT d.id) AS total_documents,
  SUM(cm.tokens_used) AS total_tokens_used
FROM users u
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
LEFT JOIN documents d ON u.id = d.user_id
GROUP BY u.id, u.username, u.email, u.created_at, u.last_login;

COMMENT ON VIEW user_activity_summary IS 'Overall user activity statistics';
