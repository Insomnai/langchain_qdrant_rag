import { createVectorStore, createVectorStoreFromDocuments, addDocumentsToVectorStore } from './vectorStore.js';
import { createRAGChainWithSources } from './chain.js';
import { splitDocuments } from '../utils/documentLoader.js';

let vectorStore = null;
let ragChain = null;

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

export async function initializeRAG() {
  console.log('🔄 Initializing RAG system...');
  
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

export function getVectorStore() {
  return vectorStore;
}

export function getRAGChain() {
  return ragChain;
}
