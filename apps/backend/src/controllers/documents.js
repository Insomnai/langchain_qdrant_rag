import { getPool } from '../config/database.js';
import { getRAG } from '../rag/index.js';

/**
 * Add document to RAG system and database
 * POST /api/documents/add
 */
export async function addDocument(req, res) {
  try {
    const { content, metadata = {} } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Zawartość dokumentu jest wymagana'
      });
    }

    const pool = getPool();
    const rag = getRAG();

    if (!rag) {
      return res.status(503).json({
        success: false,
        message: 'System RAG nie jest zainicjalizowany'
      });
    }

    // Save document to database FIRST
    const filename = metadata.filename || metadata.source || 'document.txt';
    const fileSize = Buffer.byteLength(content, 'utf8');
    const fileType = metadata.type || 'text/plain';

    const documentResult = await pool.query(
      `INSERT INTO documents (user_id, filename, file_size, file_type, original_content, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, filename, fileSize, fileType, content, JSON.stringify(metadata)]
    );

    const documentId = documentResult.rows[0].id;

    try {
      // Add to RAG system
      const ragResult = await rag.addDocuments([
        {
          pageContent: content,
          metadata: {
            ...metadata,
            document_id: documentId,
            user_id: userId
          }
        }
      ]);

      // Get chunk count from RAG result
      const chunkCount = ragResult.chunkCount || 0;

      // Mark document as processed and save chunk count
      await pool.query(
        `UPDATE documents 
         SET is_processed = TRUE, processed_at = NOW(), chunk_count = $1
         WHERE id = $2`,
        [chunkCount, documentId]
      );

      // Save document chunks to database
      if (ragResult.chunks && ragResult.chunks.length > 0) {
        const { randomUUID } = await import('crypto');
        
        const chunkValues = ragResult.chunks.map((chunk, index) => 
          `($1, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${index * 4 + 5})`
        ).join(',');

        const chunkParams = [documentId];
        ragResult.chunks.forEach((chunk, index) => {
          chunkParams.push(chunk.pageContent);  // content
          chunkParams.push(index);  // chunk_index
          chunkParams.push(randomUUID());  // qdrant_point_id
          chunkParams.push(JSON.stringify(chunk.metadata));  // metadata
        });

        await pool.query(
          `INSERT INTO document_chunks (document_id, content, chunk_index, qdrant_point_id, metadata)
           VALUES ${chunkValues}`,
          chunkParams
        );
      }

      res.json({
        success: true,
        message: 'Dokument dodany pomyślnie',
        documentId: documentId,
        chunkCount: chunkCount
      });

    } catch (ragError) {
      // If RAG fails, mark document as failed but keep in database
      await pool.query(
        `UPDATE documents 
         SET is_processed = FALSE, 
             metadata = metadata || jsonb_build_object('error', $1)
         WHERE id = $2`,
        [ragError.message, documentId]
      );

      throw ragError;
    }

  } catch (error) {
    console.error('❌ Add document error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd dodawania dokumentu',
      error: error.message
    });
  }
}

/**
 * Get all documents for current user
 * GET /api/documents
 */
export async function getDocuments(req, res) {
  try {
    const userId = req.user.id;

    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, filename, file_size, file_type, upload_date,
        is_processed, processed_at, chunk_count, metadata
       FROM documents
       WHERE user_id = $1
       ORDER BY upload_date DESC`,
      [userId]
    );

    res.json({
      success: true,
      documents: result.rows
    });

  } catch (error) {
    console.error('❌ Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd pobierania dokumentów'
    });
  }
}

/**
 * Get single document details
 * GET /api/documents/:id
 */
export async function getDocument(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, filename, file_size, file_type, original_content,
        upload_date, is_processed, processed_at, chunk_count, metadata
       FROM documents
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dokument nie znaleziony'
      });
    }

    res.json({
      success: true,
      document: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd pobierania dokumentu'
    });
  }
}

/**
 * Delete document
 * DELETE /api/documents/:id
 */
export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const pool = getPool();
    
    // Delete from database (cascades to chunks)
    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dokument nie znaleziony'
      });
    }

    // TODO: Delete from Qdrant vector store
    // (requires implementing vector ID tracking)

    res.json({
      success: true,
      message: 'Dokument usunięty'
    });

  } catch (error) {
    console.error('❌ Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd usuwania dokumentu'
    });
  }
}
