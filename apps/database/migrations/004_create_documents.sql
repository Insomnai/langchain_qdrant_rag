-- Migration: Create documents table
-- Description: User-uploaded documents for RAG system

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100),
  original_content TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  chunk_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_documents_processed ON documents(is_processed) WHERE is_processed = FALSE;

COMMENT ON TABLE documents IS 'User-uploaded documents for the RAG system';
COMMENT ON COLUMN documents.original_content IS 'Full text content of the document';
COMMENT ON COLUMN documents.metadata IS 'JSON metadata (file info, custom tags, etc.)';
COMMENT ON COLUMN documents.is_processed IS 'Whether document has been chunked and vectorized';
COMMENT ON COLUMN documents.chunk_count IS 'Number of chunks created from this document';
