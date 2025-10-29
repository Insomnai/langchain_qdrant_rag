# Full-Stack RAG Application - Monorepo

## Przegląd Projektu

Full-stack aplikacja RAG (Retrieval-Augmented Generation) zbudowana jako monorepo z:
- **Frontend**: React + Vite + Tailwind + shadcn/ui (sklonowany z Lovable)
- **Backend**: Node.js + Express + LangChain + Qdrant
- **Shared**: TypeScript types dla type-safety

## Ostatnie Zmiany

**28 października 2025**
- Przekształcono projekt w monorepo structure
- Zintegr owano frontend z GitHub (Lovable) z backendem RAG
- Utworzono Express.js API dla operacji RAG
- Skonfigurowano Vite proxy dla komunikacji frontend ↔ backend
- Dodano shared TypeScript types
- Skonfigurowano npm workspaces
- Dodano concurrently dla równoczesnego uruchamiania apps

## Architektura Monorepo

```
rag-fullstack-monorepo/
├── apps/
│   ├── frontend/              # React frontend (port 5000)
│   │   ├── src/
│   │   ├── public/
│   │   ├── vite.config.ts     # Proxy /api -> backend
│   │   └── package.json
│   └── backend/               # Express API (port 3000)
│       ├── src/
│       │   ├── config/        # Konfiguracja .env
│       │   ├── rag/           # LangChain + Qdrant
│       │   └── utils/
│       ├── server.js          # Express API server
│       └── package.json
├── packages/
│   └── shared/                # Wspólne typy
│       ├── types/
│       │   └── api.ts         # TypeScript interfaces
│       └── index.ts
├── .env                       # Konfiguracja (root)
├── .gitignore                 # Ignores node_modules, .env
├── package.json               # Root workspace config
└── README.md
```

## Workflow

### Replit Workflow: "Full-Stack App"
- **Command**: `npm run dev`
- **Port**: 5000 (frontend)
- **Output**: Webview
- Uruchamia równocześnie frontend i backend

### Scripts

```json
{
  "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
  "dev:frontend": "npm run dev --workspace=apps/frontend",
  "dev:backend": "npm run dev --workspace=apps/backend",
  "build": "npm run build --workspaces"
}
```

## Konfiguracja

### Plik .env (root projektu)

```env
OPENAI_API_KEY=your_key_here
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=langchain_rag_collection
```

Backend automatycznie czyta `.env` z głównego katalogu projektu.

## API Endpoints (Backend)

### `/api/health` - GET
Sprawdzenie statusu backendu i połączenia z Qdrant

### `/api/documents/add` - POST
Dodawanie dokumentów do bazy wektorowej
```json
{
  "content": "tekst dokumentu",
  "metadata": { "source": "example" }
}
```

### `/api/chat` - POST
Zadawanie pytań do RAG system
```json
{
  "question": "twoje pytanie",
  "k": 3
}
```

## Frontend ↔ Backend Communication

### Vite Proxy Configuration
```typescript
// apps/frontend/vite.config.ts
server: {
  host: "0.0.0.0",
  port: 5000,
  allowedHosts: true,  // OBLIGATORYJNE dla Replit preview
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

Frontend może wykonywać requests do `/api/*` i zostaną automatycznie przekierowane do backendu.

## Shared Types

Wspólne typy TypeScript w `packages/shared/types/api.ts`:

```typescript
export interface Document { ... }
export interface AddDocumentRequest { ... }
export interface ChatRequest { ... }
export interface ChatResponse { ... }
export interface HealthResponse { ... }
```

Używane zarówno przez frontend (dla HTTP requests) jak i backend (dla API responses).

## Technologie

### Frontend
- React 18
- TypeScript
- Vite (build tool)
- Tailwind CSS
- shadcn/ui components
- React Router

### Backend
- Node.js (ES Modules)
- Express.js
- LangChain
- OpenAI (embeddings + LLM)
- Qdrant (vector database)
- dotenv (env management)

### DevOps
- npm workspaces
- concurrently (parallel execution)
- Replit deployment

## Development Flow

1. **Start development**: `npm run dev`
2. **Frontend** (localhost:5000) - interfejs użytkownika
3. **Backend** (localhost:3000) - API endpoints
4. Frontend proxy `/api/*` → Backend

## Deployment

### Replit
- Frontend automatycznie dostępny przez webview (port 5000)
- Backend działa w tle (port 3000)
- Jeden workflow uruchamia obie aplikacje

### Production Considerations
- Frontend można zbudować: `npm run build:frontend`
- Backend może serwować zbudowany frontend jako static files
- Alternatywnie: osobne deploymenty (Netlify/Vercel + Railway/Fly.io)

## Preferencje Użytkownika

- **Język**: Polski (komunikaty, komentarze, dokumentacja)
- **Zarządzanie kluczami**: Plik `.env` (nie Replit Secrets)
- **Frontend source**: GitHub (Lovable)
- **Struktura**: Monorepo (apps/, packages/)

## Bezpieczeństwo

- `.env` w `.gitignore`
- Klucze API nie są commitowane
- CORS enabled dla development
- Walidacja input w API endpoints

## Git Setup

Frontend został sklonowany z:
```
https://github.com/Insomnai/rag-sample-49668
```

**Uwaga**: Folder `apps/frontend/.git` powinien być usunięty lub zignorowany aby uniknąć konfliktów z głównym repo.

## Troubleshooting

### "RAG system not initialized"
- Uzupełnij `OPENAI_API_KEY` w `.env`
- Upewnij się że Qdrant jest dostępny

### Frontend nie widzi backendu
- Sprawdź czy backend działa (port 3000)
- Zweryfikuj Vite proxy config

### Port conflicts
- Frontend MUSI być na porcie 5000 (Replit webview requirement)
- Backend na porcie 3000 (konfigurowalny przez PORT env var)

## Next Steps / TODOs

1. Połączyć frontend UI z backend API (fetch calls)
2. Dodać UI dla dodawania dokumentów
3. Dodać chat interface
4. Rozważyć dodanie authentication
5. Setup production build workflow
6. Dodać error handling w frontend
7. Rozważyć WebSocket dla streaming responses

## Resources

- Frontend (Lovable): https://lovable.dev/projects/60862761-6587-4de9-b13e-9bc11e226285
- GitHub: https://github.com/Insomnai/rag-sample-49668
- LangChain Docs: https://js.langchain.com/
- Qdrant Docs: https://qdrant.tech/documentation/
