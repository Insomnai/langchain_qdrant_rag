# 🚀 Full-Stack RAG Application

Aplikacja RAG (Retrieval-Augmented Generation) z frontendem React i backendem LangChain + Qdrant.

## 📦 Struktura Projektu

```
├── apps/
│   ├── frontend/           # React + Vite + Tailwind + shadcn/ui
│   └── backend/            # Node.js + Express + LangChain + Qdrant
├── packages/
│   └── shared/             # Wspólne typy TypeScript
├── package.json            # Root workspace
└── .env                    # Konfiguracja (klucze API)
```

## 🚀 Szybki Start

### 1. Konfiguracja Środowiska

Uzupełnij plik `.env` w głównym katalogu:

```env
OPENAI_API_KEY=twój_klucz_openai_tutaj

QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=twój_klucz_qdrant_tutaj

QDRANT_COLLECTION_NAME=langchain_rag_collection
```

### 2. Instalacja Zależności

```bash
npm install
```

### 3. Uruchomienie Aplikacji

```bash
npm run dev
```

To uruchomi:
- **Frontend** na `http://localhost:5000`
- **Backend API** na `http://localhost:3000`

### Alternatywnie - Osobno

```bash
# Tylko frontend
npm run dev:frontend

# Tylko backend
npm run dev:backend
```

## 🔧 API Endpointy

Backend udostępnia następujące endpointy:

### Health Check
```bash
GET http://localhost:3000/api/health
```

Odpowiedź:
```json
{
  "status": "ok",
  "backend": true,
  "qdrant": true,
  "message": "All systems operational"
}
```

### Dodawanie Dokumentów
```bash
POST http://localhost:3000/api/documents/add
Content-Type: application/json

{
  "content": "Twój tekst dokumentu tutaj",
  "metadata": {
    "source": "example",
    "category": "info"
  }
}
```

Odpowiedź:
```json
{
  "success": true,
  "documentId": "uuid-here",
  "message": "Document added successfully (split into 3 chunks)"
}
```

### Chat z RAG
```bash
POST http://localhost:3000/api/chat
Content-Type: application/json

{
  "question": "Twoje pytanie tutaj",
  "k": 3
}
```

Odpowiedź:
```json
{
  "answer": "Odpowiedź wygenerowana przez AI na podstawie dokumentów",
  "sources": [
    {
      "content": "Fragment dokumentu użyty jako kontekst",
      "metadata": { "source": "example" }
    }
  ]
}
```

## 🛠️ Dostępne Komendy

| Komenda | Opis |
|---------|------|
| `npm run dev` | Uruchamia frontend i backend równolegle |
| `npm run dev:frontend` | Tylko frontend (port 5000) |
| `npm run dev:backend` | Tylko backend (port 3000) |
| `npm run build` | Buduje obie aplikacje |
| `npm start` | Uruchamia backend w trybie produkcyjnym |

## 🏗️ Architektura

### Frontend (apps/frontend)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Routing**: React Router
- **Port**: 5000

Frontend automatycznie proxy'uje wszystkie requesty `/api/*` do backendu.

### Backend (apps/backend)
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **AI**: LangChain + OpenAI
- **Vector DB**: Qdrant
- **Port**: 3000

Backend serwuje REST API dla operacji RAG.

### Shared (packages/shared)
- **TypeScript types** współdzielone między frontendem a backendem
- Zapewnia type-safety dla komunikacji API

## 🔑 Zmienne Środowiskowe

| Zmienna | Wymagana | Opis | Domyślna wartość |
|---------|----------|------|------------------|
| `OPENAI_API_KEY` | ✅ Tak | Klucz API OpenAI | - |
| `QDRANT_URL` | ❌ Nie | URL instancji Qdrant | `http://localhost:6333` |
| `QDRANT_API_KEY` | ❌ Nie* | Klucz API Qdrant Cloud | - |
| `QDRANT_COLLECTION_NAME` | ❌ Nie | Nazwa kolekcji | `langchain_rag_collection` |

\* Wymagany tylko dla Qdrant Cloud

## 🐳 Uruchomienie Qdrant (Opcjonalnie)

Jeśli nie używasz Qdrant Cloud, uruchom lokalnie:

```bash
docker run -p 6333:6333 qdrant/qdrant
```

## 📚 Przykładowe Użycie

### 1. Dodaj dokument przez API

```bash
curl -X POST http://localhost:3000/api/documents/add \
  -H "Content-Type: application/json" \
  -d '{
    "content": "LangChain to framework do budowania aplikacji AI. Qdrant to baza wektorowa.",
    "metadata": {"source": "tutorial"}
  }'
```

### 2. Zapytaj RAG

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Co to jest LangChain?"
  }'
```

## 🧪 Development

### Dodawanie nowych features

1. **Frontend**: Edytuj pliki w `apps/frontend/src`
2. **Backend**: Edytuj pliki w `apps/backend/src`
3. **Shared Types**: Dodaj do `packages/shared/types`

### Hot Reload

Obie aplikacje mają włączony hot reload:
- Frontend: Vite HMR
- Backend: Restart przy zmianach (możesz dodać nodemon)

## 🔒 Bezpieczeństwo

- Plik `.env` jest w `.gitignore` - nie commituj kluczy API
- CORS włączony w backendzie
- API keys zarządzane przez plik `.env`

## 📖 Dokumentacja

- **LangChain**: https://js.langchain.com/
- **Qdrant**: https://qdrant.tech/documentation/
- **Vite**: https://vitejs.dev/
- **shadcn/ui**: https://ui.shadcn.com/

## 🆘 Troubleshooting

### Backend nie startuje
- Sprawdź czy `.env` istnieje w głównym katalogu
- Zweryfikuj klucze API w `.env`
- Upewnij się, że Qdrant jest dostępny

### Frontend nie łączy się z backendem
- Sprawdź czy backend działa na porcie 3000
- Zweryfikuj konfigurację proxy w `apps/frontend/vite.config.ts`

### "RAG system not initialized"
- Dodaj `OPENAI_API_KEY` do `.env`
- Upewnij się, że Qdrant jest dostępny

## 📝 Licencja

ISC
