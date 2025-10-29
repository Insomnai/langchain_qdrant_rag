-- Migration: Create chat_message_sources table
-- Description: Links between chat messages and document chunks used as sources

CREATE TABLE IF NOT EXISTS chat_message_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  document_chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  relevance_score FLOAT,
  chunk_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_message_sources_message_id ON chat_message_sources(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_sources_chunk_id ON chat_message_sources(document_chunk_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_sources_score ON chat_message_sources(relevance_score DESC);

COMMENT ON TABLE chat_message_sources IS 'Links chat messages to source document chunks';
COMMENT ON COLUMN chat_message_sources.relevance_score IS 'Similarity score from vector search (0-1)';
COMMENT ON COLUMN chat_message_sources.chunk_position IS 'Position in the list of sources returned';
