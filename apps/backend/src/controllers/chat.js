import { getPool } from '../config/database.js';
import { getRAG } from '../rag/index.js';

/**
 * Create new chat session
 * POST /api/chat/sessions
 */
export async function createSession(req, res) {
  try {
    const { title } = req.body;
    const userId = req.user.id;

    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO chat_sessions (user_id, title)
       VALUES ($1, $2)
       RETURNING id, title, created_at`,
      [userId, title || 'Nowa rozmowa']
    );

    res.json({
      success: true,
      session: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd tworzenia sesji'
    });
  }
}

/**
 * Get all chat sessions for current user
 * GET /api/chat/sessions
 */
export async function getSessions(req, res) {
  try {
    const userId = req.user.id;

    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        cs.id, cs.title, cs.created_at, cs.updated_at,
        COUNT(cm.id) as message_count
       FROM chat_sessions cs
       LEFT JOIN chat_messages cm ON cs.id = cm.session_id
       WHERE cs.user_id = $1 AND cs.is_archived = FALSE
       GROUP BY cs.id
       ORDER BY cs.updated_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      sessions: result.rows
    });

  } catch (error) {
    console.error('❌ Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd pobierania sesji'
    });
  }
}

/**
 * Get messages for specific session
 * GET /api/chat/sessions/:id/messages
 */
export async function getSessionMessages(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const pool = getPool();
    
    // Verify session belongs to user
    const sessionResult = await pool.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sesja nie znaleziona'
      });
    }

    // Get messages with sources
    const messagesResult = await pool.query(
      `SELECT 
        cm.id, cm.role, cm.content, cm.created_at, cm.tokens_used, cm.model,
        json_agg(
          json_build_object(
            'content', cms.source_content,
            'metadata', cms.source_metadata
          ) ORDER BY cms.id
        ) FILTER (WHERE cms.id IS NOT NULL) as sources
       FROM chat_messages cm
       LEFT JOIN chat_message_sources cms ON cm.id = cms.message_id
       WHERE cm.session_id = $1
       GROUP BY cm.id
       ORDER BY cm.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      messages: messagesResult.rows
    });

  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd pobierania wiadomości'
    });
  }
}

/**
 * Send message in chat (RAG query)
 * POST /api/chat/sessions/:id/message
 */
export async function sendMessage(req, res) {
  try {
    const { id: sessionId } = req.params;
    const { question, k = 3 } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Pytanie jest wymagane'
      });
    }

    const pool = getPool();
    
    // Verify session belongs to user
    const sessionResult = await pool.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sesja nie znaleziona'
      });
    }

    // Save user message
    const userMessageResult = await pool.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, 'user', $2)
       RETURNING id`,
      [sessionId, question]
    );

    const userMessageId = userMessageResult.rows[0].id;

    // Get RAG response
    const rag = getRAG();
    if (!rag) {
      return res.status(503).json({
        success: false,
        message: 'System RAG nie jest zainicjalizowany'
      });
    }

    const ragResult = await rag.query(question, k);

    // Save assistant message
    const assistantMessageResult = await pool.query(
      `INSERT INTO chat_messages (session_id, role, content, model)
       VALUES ($1, 'assistant', $2, $3)
       RETURNING id`,
      [sessionId, ragResult.answer, 'gpt-3.5-turbo']
    );

    const assistantMessageId = assistantMessageResult.rows[0].id;

    // Save sources
    if (ragResult.sources && ragResult.sources.length > 0) {
      const sourceValues = ragResult.sources.map((source, index) => 
        `($1, $${index * 2 + 2}, $${index * 2 + 3})`
      ).join(',');

      const sourceParams = [assistantMessageId];
      ragResult.sources.forEach(source => {
        sourceParams.push(source.pageContent);
        sourceParams.push(JSON.stringify(source.metadata));
      });

      await pool.query(
        `INSERT INTO chat_message_sources (message_id, source_content, source_metadata)
         VALUES ${sourceValues}`,
        sourceParams
      );
    }

    // Update session timestamp
    await pool.query(
      'UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1',
      [sessionId]
    );

    res.json({
      success: true,
      message: {
        id: assistantMessageId,
        role: 'assistant',
        content: ragResult.answer,
        sources: ragResult.sources
      }
    });

  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd przetwarzania wiadomości',
      error: error.message
    });
  }
}

/**
 * Delete chat session
 * DELETE /api/chat/sessions/:id
 */
export async function deleteSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const pool = getPool();
    
    // Soft delete (archive)
    const result = await pool.query(
      `UPDATE chat_sessions 
       SET is_archived = TRUE, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sesja nie znaleziona'
      });
    }

    res.json({
      success: true,
      message: 'Sesja usunięta'
    });

  } catch (error) {
    console.error('❌ Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd usuwania sesji'
    });
  }
}
