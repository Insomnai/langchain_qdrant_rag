import { QdrantVectorStore } from '@langchain/qdrant';
import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config/env.js';
import { createEmbeddings } from './embeddings.js';

export async function createVectorStore() {
  const client = new QdrantClient({
    url: config.qdrant.url,
    apiKey: config.qdrant.apiKey,
  });

  const embeddings = createEmbeddings();

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      client,
      collectionName: config.qdrant.collectionName,
    }
  );

  return vectorStore;
}

export async function createVectorStoreFromDocuments(documents) {
  const client = new QdrantClient({
    url: config.qdrant.url,
    apiKey: config.qdrant.apiKey,
  });

  const embeddings = createEmbeddings();

  const vectorStore = await QdrantVectorStore.fromDocuments(
    documents,
    embeddings,
    {
      client,
      collectionName: config.qdrant.collectionName,
    }
  );

  return vectorStore;
}

export async function addDocumentsToVectorStore(vectorStore, documents) {
  await vectorStore.addDocuments(documents);
  console.log(`✅ Dodano ${documents.length} dokumentów do bazy wektorowej`);
}
