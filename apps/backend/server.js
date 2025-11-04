import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { validateConfig } from './src/config/env.js';
import {
  createVectorStore,
  createVectorStoreFromDocuments,
  addDocumentsToVectorStore,
} from './src/rag/vectorStore.js';
import { createRAGChainWithSources } from './src/rag/chain.js';
import { createDocumentsFromText, splitDocuments } from './src/utils/documentLoader.js';
import { testDatabaseConnection, getPool } from './src/config/database.js';
import { authenticateToken } from './src/middleware/auth.js';
import * as authController from './src/controllers/auth.js';
import * as chatController from './src/controllers/chat.js';
import * as documentsController from './src/controllers/documents.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let vectorStore = null;
let ragChain = null;

async function initializeRAG() {
  console.log('🔄 Initializing RAG system...');
  
  if (!validateConfig()) {
    console.error('❌ Configuration invalid. Please check your .env file');
    return false;
  }

  try {
    vectorStore = await createVectorStore();
    ragChain = await createRAGChainWithSources(vectorStore, {
      modelName: 'gpt-3.5-turbo',
      temperature: 0.3,
      k: 3,
    });
    console.log('✅ RAG system initialized successfully');
    return true;
  } catch (error) {
    if (error.message?.includes('Collection') || error.message?.includes('not found')) {
      console.log('⚠️  Collection does not exist yet. Will create on first document upload.');
      return true;
    }
    console.error('❌ Failed to initialize RAG:', error.message);
    return false;
  }
}

export function getRAG() {
  if (!ragChain || !vectorStore) {
    return null;
  }
  
  return {
    async query(question, k = 3) {
      const result = await ragChain.invoke(question);
      return {
        answer: result.answer,
        sources: result.sources.map(doc => ({
          pageContent: doc.pageContent,
          metadata: doc.metadata,
        })),
      };
    },
    
    async addDocuments(documents) {
      const splitDocs = await splitDocuments(documents, {
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      if (!vectorStore) {
        vectorStore = await createVectorStoreFromDocuments(splitDocs);
        ragChain = await createRAGChainWithSources(vectorStore, {
          modelName: 'gpt-3.5-turbo',
          temperature: 0.3,
          k: 3,
        });
      } else {
        await addDocumentsToVectorStore(vectorStore, splitDocs);
      }

      return {
        chunkCount: splitDocs.length,
        chunks: splitDocs.map((doc, index) => ({
          pageContent: doc.pageContent,
          metadata: { ...doc.metadata, chunkIndex: index }
        }))
      };
    }
  };
}

app.get('/api/health', async (req, res) => {
  try {
    const qdrantConnected = vectorStore !== null;
    let databaseConnected = false;
    
    try {
      const pool = getPool();
      const result = await pool.query('SELECT 1');
      databaseConnected = result.rowCount === 1;
    } catch (dbError) {
      console.warn('Database health check failed:', dbError.message);
    }
    
    res.json({
      status: 'ok',
      backend: true,
      qdrant: qdrantConnected,
      database: databaseConnected,
      message: qdrantConnected && databaseConnected 
        ? 'All systems operational' 
        : !qdrantConnected && !databaseConnected
        ? 'Qdrant and Database not connected'
        : !qdrantConnected
        ? 'Qdrant not initialized - add documents first'
        : 'Database not connected - check .env configuration',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      backend: true,
      qdrant: false,
      database: false,
      message: error.message,
    });
  }
});

// ============================================
// AUTH ROUTES (public)
// ============================================

app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/status', authController.getStatus);

// ============================================
// CHAT SESSION ROUTES (protected)
// ============================================

app.post('/api/chat/sessions', authenticateToken, chatController.createSession);
app.get('/api/chat/sessions', authenticateToken, chatController.getSessions);
app.get('/api/chat/sessions/:id/messages', authenticateToken, chatController.getSessionMessages);
app.post('/api/chat/sessions/:id/message', authenticateToken, chatController.sendMessage);
app.delete('/api/chat/sessions/:id', authenticateToken, chatController.deleteSession);

// ============================================
// DOCUMENT ROUTES (protected)
// ============================================

app.post('/api/documents/add', authenticateToken, documentsController.addDocument);
app.get('/api/documents', authenticateToken, documentsController.getDocuments);
app.get('/api/documents/:id', authenticateToken, documentsController.getDocument);
app.delete('/api/documents/:id', authenticateToken, documentsController.deleteDocument);

// ============================================
// LEGACY ROUTES (kept for backward compatibility, unprotected)
// ============================================

app.post('/api/documents/add-legacy', async (req, res) => {
  try {
    const { content, metadata = {} } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Content is required and must be a string',
      });
    }

    const documentId = uuidv4();
    const enrichedMetadata = {
      ...metadata,
      id: documentId,
      createdAt: new Date().toISOString(),
    };

    const documents = createDocumentsFromText([content], [enrichedMetadata]);
    const splitDocs = await splitDocuments(documents, {
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    if (!vectorStore) {
      vectorStore = await createVectorStoreFromDocuments(splitDocs);
      ragChain = await createRAGChainWithSources(vectorStore, {
        modelName: 'gpt-3.5-turbo',
        temperature: 0.3,
        k: 3,
      });
    } else {
      await addDocumentsToVectorStore(vectorStore, splitDocs);
    }

    res.json({
      success: true,
      documentId,
      message: `Document added successfully (split into ${splitDocs.length} chunks)`,
    });
  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message,
    });
  }
});

app.post('/api/chat-legacy', async (req, res) => {
  try {
    const { question, k = 3 } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Question is required and must be a string',
      });
    }

    if (!ragChain || !vectorStore) {
      return res.status(400).json({
        error: 'NO_DOCUMENTS',
        message: 'No documents have been added yet. Please add documents first.',
      });
    }

    const result = await ragChain.invoke(question);

    res.json({
      answer: result.answer,
      sources: result.sources.map(doc => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message,
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found',
  });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🚀 RAG API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`📄 Add documents: POST http://localhost:${PORT}/api/documents/add\n`);
  
  await testDatabaseConnection();
  
  initializeRAG().then((initialized) => {
    if (initialized) {
      console.log('✅ RAG system ready to use');
    } else {
      console.log('⚠️  RAG system not initialized - add API keys to .env file');
    }
  });
});
