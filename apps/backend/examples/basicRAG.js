import { validateConfig } from '../src/config/env.js';
import { createVectorStoreFromDocuments } from '../src/rag/vectorStore.js';
import { createRAGChain, createRAGChainWithSources } from '../src/rag/chain.js';
import { createDocumentsFromText, splitDocuments } from '../src/utils/documentLoader.js';

async function basicRAGExample() {
  console.log('🚀 Uruchamianie przykładu RAG z LangChain i Qdrant\n');

  if (!validateConfig()) {
    process.exit(1);
  }

  const sampleTexts = [
    'LangChain to framework do tworzenia aplikacji wykorzystujących modele językowe. Umożliwia łatwe budowanie chain-ów, które łączą różne komponenty AI.',
    'Qdrant to baza wektorowa open-source napisana w Rust. Jest zoptymalizowana do szybkiego wyszukiwania semantycznego i obsługuje różne metryki podobieństwa.',
    'RAG (Retrieval-Augmented Generation) to technika, która łączy wyszukiwanie informacji z generowaniem tekstu. Pozwala to modelom językowym odpowiadać na pytania z wykorzystaniem zewnętrznej wiedzy.',
    'Embeddingi to numeryczne reprezentacje tekstu, które pozwalają na porównywanie semantycznego podobieństwa między fragmentami tekstu. OpenAI oferuje modele do tworzenia embeddingów.',
    'Python i JavaScript to najpopularniejsze języki do pracy z LangChain. Framework oferuje podobne API w obu językach.',
  ];

  console.log('📚 Tworzenie dokumentów...');
  const documents = createDocumentsFromText(sampleTexts, [
    { source: 'langchain_docs', topic: 'framework' },
    { source: 'qdrant_docs', topic: 'vector_database' },
    { source: 'ai_concepts', topic: 'rag' },
    { source: 'ai_concepts', topic: 'embeddings' },
    { source: 'langchain_docs', topic: 'languages' },
  ]);

  console.log('✂️  Dzielenie dokumentów...');
  const splitDocs = await splitDocuments(documents, {
    chunkSize: 500,
    chunkOverlap: 50,
  });

  console.log('💾 Tworzenie bazy wektorowej w Qdrant...');
  const vectorStore = await createVectorStoreFromDocuments(splitDocs);

  console.log('🔗 Tworzenie RAG chain...\n');
  const chain = await createRAGChain(vectorStore, {
    modelName: 'gpt-3.5-turbo',
    temperature: 0.3,
    k: 3,
  });

  const questions = [
    'Co to jest LangChain?',
    'Jakie są zalety używania Qdrant?',
    'Wyjaśnij czym jest RAG',
  ];

  console.log('❓ Zadawanie pytań:\n');
  for (const question of questions) {
    console.log(`Pytanie: ${question}`);
    const answer = await chain.invoke({ question });
    console.log(`Odpowiedź: ${answer}\n`);
  }

  console.log('📖 Przykład z źródłami:\n');
  const chainWithSources = await createRAGChainWithSources(vectorStore, {
    modelName: 'gpt-3.5-turbo',
    temperature: 0.3,
    k: 2,
  });

  const result = await chainWithSources.invoke('Jakie języki wspiera LangChain?');
  console.log(`Pytanie: Jakie języki wspiera LangChain?`);
  console.log(`Odpowiedź: ${result.answer}`);
  console.log(`\nŹródła (${result.sources.length}):`);
  result.sources.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.pageContent.substring(0, 100)}... (${JSON.stringify(doc.metadata)})`);
  });

  console.log('\n✅ Przykład zakończony pomyślnie!');
}

basicRAGExample().catch(console.error);
