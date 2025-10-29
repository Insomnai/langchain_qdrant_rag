-- Migration: Create document_chunks table
-- Description: Text chunks from documents, synced with Qdrant vector DB

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  qdrant_point_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_qdrant_point_id ON document_chunks(qdrant_point_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata ON document_chunks USING GIN(metadata);

COMMENT ON TABLE document_chunks IS 'Text chunks from documents, synced with Qdrant';
COMMENT ON COLUMN document_chunks.chunk_index IS 'Sequential chunk number within the document';
COMMENT ON COLUMN document_chunks.qdrant_point_id IS 'UUID of the corresponding point in Qdrant vector DB';
COMMENT ON COLUMN document_chunks.metadata IS 'JSON metadata inherited from parent document';
