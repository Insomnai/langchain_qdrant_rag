-- Migration FIX: Rebuild chat_message_sources table
-- Description: Fixes schema mismatch - replaces document_chunk_id with source_content/source_metadata
-- Run this ONLY if you have the old schema with document_chunk_id column

-- Drop old table (if exists with old schema)
DROP TABLE IF EXISTS chat_message_sources CASCADE;

-- Recreate with correct schema
CREATE TABLE chat_message_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  source_content TEXT NOT NULL,
  source_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_message_sources_message_id ON chat_message_sources(message_id);
CREATE INDEX idx_chat_message_sources_metadata ON chat_message_sources USING GIN (source_metadata);

COMMENT ON TABLE chat_message_sources IS 'Stores RAG source documents used for generating responses';
COMMENT ON COLUMN chat_message_sources.source_content IS 'Text content from the retrieved document chunk';
COMMENT ON COLUMN chat_message_sources.source_metadata IS 'Metadata from LangChain source (filename, page, etc.)';

-- Recreate views that depend on this table
DROP VIEW IF EXISTS document_stats CASCADE;

CREATE OR REPLACE VIEW document_stats AS
SELECT 
  d.id AS document_id,
  d.user_id,
  d.filename,
  d.file_size,
  d.upload_date,
  d.chunk_count,
  d.is_processed,
  COUNT(DISTINCT dc.id) AS total_chunks
FROM documents d
LEFT JOIN document_chunks dc ON d.id = dc.document_id
GROUP BY d.id, d.user_id, d.filename, d.file_size, d.upload_date, d.chunk_count, d.is_processed;

COMMENT ON VIEW document_stats IS 'Document statistics with chunk counts';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ chat_message_sources table fixed successfully';
  RAISE NOTICE '   - Old schema with document_chunk_id removed';
  RAISE NOTICE '   - New schema with source_content and source_metadata created';
  RAISE NOTICE '   - Views recreated';
END $$;
