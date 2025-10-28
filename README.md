# 🦜 LangChain RAG Framework z Qdrant

Framework do tworzenia aplikacji RAG (Retrieval-Augmented Generation) z wykorzystaniem LangChain i bazy wektorowej Qdrant.

## 🚀 Szybki start

### 1. Konfiguracja

Skopiuj przykładowy plik konfiguracyjny:

```bash
cp .env.example .env
```

Edytuj plik `.env` i uzupełnij wymagane klucze API:

```env
OPENAI_API_KEY=twój_klucz_api_openai

QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=twój_klucz_api_qdrant

QDRANT_COLLECTION_NAME=langchain_rag_collection
```

### 2. Uruchomienie lokalnej instancji Qdrant (opcjonalnie)

Jeśli nie masz dostępu do Qdrant Cloud, uruchom lokalną instancję:

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### 3. Testowanie

Uruchom przykładową aplikację:

```bash
npm run example
```

Lub uruchom główny plik:

```bash
npm start
```

## 📁 Struktura projektu

```
├── src/
│   ├── config/
│   │   └── env.js              # Zarządzanie konfiguracją przez .env
│   ├── rag/
│   │   ├── embeddings.js       # Konfiguracja OpenAI embeddings
│   │   ├── vectorStore.js      # Integracja z Qdrant
│   │   ├── retriever.js        # Retriever do wyszukiwania
│   │   └── chain.js            # RAG Chain (łańcuch RAG)
│   └── utils/
│       └── documentLoader.js   # Narzędzia do pracy z dokumentami
├── examples/
│   └── basicRAG.js             # Przykład użycia
├── index.js                    # Główny punkt wejścia
├── .env.example                # Przykładowa konfiguracja
└── README.md
```

## 💡 Przykłady użycia

### Podstawowy RAG

```javascript
import { validateConfig } from './src/config/env.js';
import { createVectorStoreFromDocuments } from './src/rag/vectorStore.js';
import { createRAGChain } from './src/rag/chain.js';
import { createDocumentsFromText, splitDocuments } from './src/utils/documentLoader.js';

// Walidacja konfiguracji
if (!validateConfig()) {
  process.exit(1);
}

// Tworzenie dokumentów
const documents = createDocumentsFromText([
  'LangChain to framework do tworzenia aplikacji AI.',
  'Qdrant to baza wektorowa open-source.',
  'RAG łączy wyszukiwanie z generowaniem tekstu.',
]);

// Dzielenie dokumentów na mniejsze fragmenty
const splitDocs = await splitDocuments(documents, {
  chunkSize: 500,
  chunkOverlap: 50,
});

// Tworzenie bazy wektorowej
const vectorStore = await createVectorStoreFromDocuments(splitDocs);

// Tworzenie RAG chain
const chain = await createRAGChain(vectorStore, {
  modelName: 'gpt-3.5-turbo',
  temperature: 0.3,
  k: 3,
});

// Zadawanie pytania
const answer = await chain.invoke({ question: 'Co to jest LangChain?' });
console.log(answer);
```

### RAG ze źródłami

```javascript
import { createRAGChainWithSources } from './src/rag/chain.js';

const chainWithSources = await createRAGChainWithSources(vectorStore, {
  modelName: 'gpt-3.5-turbo',
  k: 2,
});

const result = await chainWithSources.invoke('Co to jest RAG?');

console.log('Odpowiedź:', result.answer);
console.log('\nŹródła:');
result.sources.forEach((doc, i) => {
  console.log(`${i + 1}. ${doc.pageContent}`);
  console.log(`   Metadata:`, doc.metadata);
});
```

### Dodawanie dokumentów do istniejącej bazy

```javascript
import { createVectorStore, addDocumentsToVectorStore } from './src/rag/vectorStore.js';

// Połączenie z istniejącą kolekcją
const vectorStore = await createVectorStore();

// Nowe dokumenty
const newDocs = createDocumentsFromText([
  'Nowy dokument 1',
  'Nowy dokument 2',
]);

// Dodanie do bazy
await addDocumentsToVectorStore(vectorStore, newDocs);
```

### Własny prompt

```javascript
const customPrompt = `Jesteś ekspertem AI. Odpowiedz na pytanie używając kontekstu.
Jeśli nie wiesz odpowiedzi, powiedz to wprost.

Kontekst:
{context}

Pytanie: {question}

Szczegółowa odpowiedź:`;

const chain = await createRAGChain(vectorStore, {
  modelName: 'gpt-4',
  temperature: 0.5,
  promptTemplate: customPrompt,
});
```

## 🔧 Dostępne funkcje

### Vector Store

- `createVectorStore()` - połączenie z istniejącą kolekcją Qdrant
- `createVectorStoreFromDocuments(documents)` - utworzenie nowej kolekcji z dokumentów
- `addDocumentsToVectorStore(vectorStore, documents)` - dodanie dokumentów do istniejącej bazy

### RAG Chain

- `createRAGChain(vectorStore, options)` - utworzenie łańcucha RAG
- `createRAGChainWithSources(vectorStore, options)` - RAG z informacją o źródłach

### Document Loader

- `createDocumentsFromText(texts, metadatas)` - utworzenie dokumentów z tekstów
- `splitDocuments(documents, options)` - podział dokumentów na fragmenty
- `loadAndSplitText(text, metadata, options)` - załadowanie i podział pojedynczego tekstu

## 🔑 Zmienne środowiskowe

| Zmienna | Opis | Wymagana | Domyślna wartość |
|---------|------|----------|------------------|
| `OPENAI_API_KEY` | Klucz API OpenAI | ✅ Tak | - |
| `QDRANT_URL` | URL instancji Qdrant | ❌ Nie | `http://localhost:6333` |
| `QDRANT_API_KEY` | Klucz API Qdrant | ❌ Nie* | - |
| `QDRANT_COLLECTION_NAME` | Nazwa kolekcji | ❌ Nie | `langchain_rag_collection` |

\* Wymagany tylko dla Qdrant Cloud

## 📦 Zależności

- `langchain` - główny framework LangChain
- `@langchain/openai` - integracja z OpenAI
- `@langchain/qdrant` - integracja z Qdrant
- `@langchain/core` - podstawowe typy LangChain
- `@langchain/community` - dodatkowe komponenty
- `@qdrant/js-client-rest` - klient Qdrant
- `dotenv` - zarządzanie zmiennymi środowiskowymi
- `uuid` - generowanie unikalnych identyfikatorów

## 🛡️ Bezpieczeństwo

- Plik `.env` jest w `.gitignore` - klucze API nie są commitowane
- Walidacja konfiguracji przed uruchomieniem aplikacji
- Jasne komunikaty błędów o brakujących kluczach

## 📚 Dokumentacja

- [LangChain JS Documentation](https://js.langchain.com/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)

## 🤝 Wkład

Framework jest gotowy do rozbudowy. Możesz dodać:
- Własne loadery dokumentów (PDF, CSV, etc.)
- Różne strategie dzielenia dokumentów
- Własne modele embeddings
- Dodatkowe metody wyszukiwania
- Customowe chain'y RAG

## 📄 Licencja

ISC
