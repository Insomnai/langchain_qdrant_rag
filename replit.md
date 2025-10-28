# LangChain RAG Framework z Qdrant

## Przegląd projektu

Framework RAG (Retrieval-Augmented Generation) zbudowany z wykorzystaniem LangChain i bazy wektorowej Qdrant. Umożliwia tworzenie inteligentnych systemów, które mogą odpowiadać na pytania wykorzystując kontekst z własnej bazy wiedzy.

## Ostatnie zmiany

**28 października 2025**
- Utworzono kompletną strukturę projektu dla RAG
- Zaimplementowano integrację LangChain z Qdrant
- Dodano system zarządzania konfiguracją przez plik .env
- Utworzono moduły: embeddings, vector store, retriever, chain
- Dodano narzędzia do ładowania i dzielenia dokumentów
- Utworzono przykładową aplikację demonstracyjną

## Struktura projektu

```
├── src/
│   ├── config/
│   │   └── env.js              # Konfiguracja środowiska (.env)
│   ├── rag/
│   │   ├── embeddings.js       # Konfiguracja OpenAI embeddings
│   │   ├── vectorStore.js      # Integracja z Qdrant
│   │   ├── retriever.js        # Retriever dla RAG
│   │   └── chain.js            # RAG chain
│   └── utils/
│       └── documentLoader.js   # Narzędzia do dokumentów
├── examples/
│   └── basicRAG.js             # Przykład użycia
├── index.js                    # Główny punkt wejścia
├── .env.example                # Przykładowa konfiguracja
└── package.json
```

## Konfiguracja

### Wymagane klucze API

Zarządzanie kluczami API odbywa się przez plik `.env`:

1. Skopiuj plik `.env.example` do `.env`
2. Uzupełnij wymagane klucze:
   - `OPENAI_API_KEY` - klucz API OpenAI
   - `QDRANT_URL` - URL instancji Qdrant
   - `QDRANT_API_KEY` - klucz API Qdrant (opcjonalny dla lokalnej instancji)
   - `QDRANT_COLLECTION_NAME` - nazwa kolekcji

### Uruchomienie lokalnej instancji Qdrant

```bash
docker run -p 6333:6333 qdrant/qdrant
```

## Architektura

### Komponenty główne

1. **Embeddings** (`src/rag/embeddings.js`)
   - Konfiguracja OpenAI embeddings
   - Model: `text-embedding-3-small`

2. **Vector Store** (`src/rag/vectorStore.js`)
   - Integracja z Qdrant
   - Tworzenie i zarządzanie kolekcjami
   - Dodawanie dokumentów

3. **Retriever** (`src/rag/retriever.js`)
   - Wyszukiwanie semantyczne
   - Konfigurowalna liczba wyników (k)
   - Wsparcie dla filtrów

4. **RAG Chain** (`src/rag/chain.js`)
   - Łańcuch RAG z LangChain
   - Integracja z ChatOpenAI
   - Wsparcie dla źródeł odpowiedzi

5. **Document Loader** (`src/utils/documentLoader.js`)
   - Tworzenie dokumentów z tekstu
   - Dzielenie dokumentów na fragmenty
   - RecursiveCharacterTextSplitter

## Użycie

### Podstawowy przykład

```javascript
import { validateConfig } from './src/config/env.js';
import { createVectorStoreFromDocuments } from './src/rag/vectorStore.js';
import { createRAGChain } from './src/rag/chain.js';
import { createDocumentsFromText } from './src/utils/documentLoader.js';

// Sprawdzenie konfiguracji
if (!validateConfig()) {
  process.exit(1);
}

// Tworzenie dokumentów
const documents = createDocumentsFromText([
  'Tekst dokumentu 1',
  'Tekst dokumentu 2',
]);

// Tworzenie bazy wektorowej
const vectorStore = await createVectorStoreFromDocuments(documents);

// Tworzenie RAG chain
const chain = await createRAGChain(vectorStore);

// Zadawanie pytania
const answer = await chain.invoke({ question: 'Twoje pytanie?' });
console.log(answer);
```

### Uruchomienie przykładu

```bash
npm run example
```

## Preferencje użytkownika

- **Zarządzanie kluczami API**: Wyłącznie przez plik `.env`, bez Replit Secrets
- **Język**: Polski (komunikaty, komentarze, dokumentacja)

## Technologie

- **LangChain**: Framework do aplikacji LLM
- **Qdrant**: Baza wektorowa
- **OpenAI**: Embeddings i LLM
- **Node.js**: Runtime JavaScript

## Bezpieczeństwo

- Plik `.env` jest w `.gitignore` (klucze API nie są commitowane)
- Walidacja konfiguracji przed uruchomieniem
- Jasne komunikaty błędów dotyczące brakujących kluczy
