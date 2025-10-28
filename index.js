import { validateConfig } from './src/config/env.js';
import { createVectorStore, createVectorStoreFromDocuments, addDocumentsToVectorStore } from './src/rag/vectorStore.js';
import { createRAGChain, createRAGChainWithSources } from './src/rag/chain.js';
import { createDocumentsFromText, splitDocuments, loadAndSplitText } from './src/utils/documentLoader.js';

console.log('🎯 LangChain RAG Framework z Qdrant\n');

if (!validateConfig()) {
  console.error('\n⚠️  Aby rozpocząć:');
  console.error('1. Skopiuj plik .env.example do .env');
  console.error('2. Uzupełnij wymagane klucze API w pliku .env');
  console.error('3. Uruchom ponownie aplikację\n');
  console.error('📖 Przykładowe użycie znajduje się w pliku examples/basicRAG.js\n');
  process.exit(1);
}

console.log('✅ Konfiguracja poprawna!');
console.log('📦 Framework RAG gotowy do użycia\n');

console.log('💡 Dostępne moduły:');
console.log('  • createVectorStore() - tworzenie połączenia z istniejącą kolekcją');
console.log('  • createVectorStoreFromDocuments(docs) - tworzenie nowej kolekcji z dokumentów');
console.log('  • addDocumentsToVectorStore(store, docs) - dodawanie dokumentów do bazy');
console.log('  • createRAGChain(store) - tworzenie łańcucha RAG');
console.log('  • createRAGChainWithSources(store) - RAG z informacją o źródłach');
console.log('  • createDocumentsFromText(texts) - tworzenie dokumentów z tekstu');
console.log('  • splitDocuments(docs) - dzielenie dokumentów na mniejsze fragmenty');
console.log('\n📚 Przykład użycia: node examples/basicRAG.js\n');

export {
  createVectorStore,
  createVectorStoreFromDocuments,
  addDocumentsToVectorStore,
  createRAGChain,
  createRAGChainWithSources,
  createDocumentsFromText,
  splitDocuments,
  loadAndSplitText,
};
