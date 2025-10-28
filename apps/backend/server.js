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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

app.get('/api/health', async (req, res) => {
  try {
    const qdrantConnected = vectorStore !== null;
    res.json({
      status: 'ok',
      backend: true,
      qdrant: qdrantConnected,
      message: qdrantConnected ? 'All systems operational' : 'Qdrant not initialized - add documents first',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      backend: true,
      qdrant: false,
      message: error.message,
    });
  }
});

app.post('/api/documents/add', async (req, res) => {
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

app.post('/api/chat', async (req, res) => {
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 RAG API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`📄 Add documents: POST http://localhost:${PORT}/api/documents/add\n`);
  
  initializeRAG().then((initialized) => {
    if (initialized) {
      console.log('✅ RAG system ready to use');
    } else {
      console.log('⚠️  RAG system not initialized - add API keys to .env file');
    }
  });
});
