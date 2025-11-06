-- Migration: Create chat_message_sources table
-- Description: Stores source documents/chunks used to generate RAG responses

CREATE TABLE IF NOT EXISTS chat_message_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  source_content TEXT NOT NULL,
  source_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_message_sources_message_id ON chat_message_sources(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_sources_metadata ON chat_message_sources USING GIN (source_metadata);

COMMENT ON TABLE chat_message_sources IS 'Stores RAG source documents used for generating responses';
COMMENT ON COLUMN chat_message_sources.source_content IS 'Text content from the retrieved document chunk';
COMMENT ON COLUMN chat_message_sources.source_metadata IS 'Metadata from LangChain source (filename, page, etc.)';
