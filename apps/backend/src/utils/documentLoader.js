import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export function createDocumentsFromText(texts, metadatas = []) {
  return texts.map((text, i) => {
    return new Document({
      pageContent: text,
      metadata: metadatas[i] || {},
    });
  });
}

export async function splitDocuments(documents, options = {}) {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
  } = options;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const splitDocs = await splitter.splitDocuments(documents);
  console.log(`📄 Podzielono dokumenty na ${splitDocs.length} fragmentów`);
  
  return splitDocs;
}

export async function loadAndSplitText(text, metadata = {}, options = {}) {
  const doc = new Document({
    pageContent: text,
    metadata,
  });

  return await splitDocuments([doc], options);
}
