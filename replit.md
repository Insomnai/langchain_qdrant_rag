# Full-Stack RAG Application - Monorepo

## Przegląd Projektu

Full-stack aplikacja RAG (Retrieval-Augmented Generation) zbudowana jako monorepo z:
- **Frontend**: React + Vite + Tailwind + shadcn/ui (sklonowany z Lovable)
- **Backend**: Node.js + Express + LangChain + Qdrant + PostgreSQL
- **Database**: PostgreSQL z pełnym schematem SQL migrations
- **Shared**: TypeScript types dla type-safety

## Ostatnie Zmiany

**4 listopada 2025** - PEŁNA INTEGRACJA BAZY DANYCH I AUTENTYKACJI
- ✅ **System autentykacji**: Login z bcrypt, session tokens, protected routes
- ✅ **Backend**: Pełna integracja PostgreSQL - czaty i dokumenty zapisywane do bazy
  - Auth endpoints: `/api/auth/login`, `/api/auth/logout`, `/api/auth/status`
  - Chat sessions: `/api/chat/sessions` (CRUD operations)
  - Messages persistent: `/api/chat/sessions/:id/message`
  - Documents persistent: `/api/documents/add` (PostgreSQL + Qdrant sync)
- ✅ **Frontend**: Pełna integracja z backendem
  - Login page z prawdziwym API (email/password)
  - Chat sessions ładowane z PostgreSQL (nie znikają po refresh!)
  - Nowe czaty tworzone w bazie danych
  - Protected routes z auth middleware
  - Token-based authentication (localStorage)
- ✅ **Database**: Admin user seed (email: admin@example.com, hasło: admin123)
- ✅ **Deployment**: Zaktualizowano DEPLOYMENT_VPS.md z instrukcjami aktualizacji
- ✅ **Struktura**: Refactor RAG module do apps/backend/src/rag/index.js

**29 października 2025**
- Dodano pełny schemat PostgreSQL jako SQL migrations (apps/database/)
- Zintegrowano pg (node-postgres) z backendem
- Dodano database connection pool z auto-reconnect
- Utworzono 8 tabel, 3 widoki, i funkcje pomocnicze
- Zwiększono limit body parser do 50MB (duże pliki PDF)
- Zaktualizowano .env.example z DATABASE_URL
- Dodano README dla VPS deployment

**28 października 2025**
- Przekształcono projekt w monorepo structure
- Zintegrowano frontend z GitHub (Lovable) z backendem RAG
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
│   ├── backend/               # Express API (port 3000)
│   │   ├── src/
│   │   │   ├── config/        # Konfiguracja .env + database pool
│   │   │   ├── rag/           # LangChain + Qdrant
│   │   │   └── utils/
│   │   ├── server.js          # Express API server
│   │   └── package.json
│   └── database/              # PostgreSQL schema
│       ├── migrations/        # SQL files (001-010)
│       ├── seeds/             # Optional seed data
│       ├── setup.sql          # Main setup file
│       └── README.md          # VPS deployment guide
├── packages/
│   └── shared/                # Wspólne typy
│       ├── types/
│       │   └── api.ts         # TypeScript interfaces
│       └── index.ts
├── .env                       # Konfiguracja (root)
├── .env.example               # Przykładowa konfiguracja
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
# OpenAI
OPENAI_API_KEY=sk-proj-your_key_here

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=langchain_rag_collection

# PostgreSQL Database
DATABASE_URL=postgresql://rag_user:password@localhost:5432/rag_app

# Server
PORT=3000
NODE_ENV=development
```

Backend automatycznie czyta `.env` z głównego katalogu projektu. 
Zobacz `.env.example` dla pełnej konfiguracji z komentarzami.

## API Endpoints (Backend)

### `/api/health` - GET
Sprawdzenie statusu backendu, połączenia z Qdrant i PostgreSQL

Response:
```json
{
  "status": "ok",
  "backend": true,
  "qdrant": true,
  "database": true,
  "message": "All systems operational"
}
```

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
- PostgreSQL (relational database)
- node-postgres (pg) - database client
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

### Development (Replit)
- Frontend automatycznie dostępny przez webview (port 5000)
- Backend działa w tle (port 3000)
- Jeden workflow uruchamia obie aplikacje

### Production (VPS) - Główny Target
Aplikacja jest przygotowana do deploymentu na VPS:

1. **Pobierz ZIP** z całym projektem
2. **Zainstaluj PostgreSQL** na VPS
3. **Uruchom migrations**: `psql -d rag_app -f apps/database/setup.sql`
4. **Zainstaluj Qdrant** (Docker lub Qdrant Cloud)
5. **Skonfiguruj .env** z prawdziwymi kluczami
6. **Build i uruchom**: `npm install && npm run build && npm start`

Zobacz `apps/database/README.md` dla szczegółów.

### Alternative Deployments
- Frontend: Netlify/Vercel (static build)
- Backend: Railway/Fly.io/własny VPS
- Database: Neon/Supabase/własny PostgreSQL

## Preferencje Użytkownika

- **Język**: Polski (komunikaty, komentarze, dokumentacja)
- **Zarządzanie kluczami**: Plik `.env` (nie Replit Secrets)
- **Frontend source**: GitHub (Lovable)
- **Struktura**: Monorepo (apps/, packages/)
- **Deployment target**: Własny VPS (nie Replit hosting)
- **Database**: PostgreSQL jako SQL migrations (nie Replit Database)

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

## Ukończone ✅

1. ✅ Połączono frontend UI z backend API (fetch calls)
2. ✅ Dodano UI dla dodawania dokumentów (FileManagement)
3. ✅ Dodano chat interface (ChatView)
4. ✅ Dodano error handling w frontend (toasts, validation)
5. ✅ Dodano PostgreSQL schemat jako SQL migrations
6. ✅ Zintegrowano database pool w backendzie
7. ✅ Dodano dokumentację VPS deployment
8. ✅ **Zaimplementowano authentication (users, sessions, bcrypt)**
9. ✅ **Podłączono zapisywanie chatów do PostgreSQL**
10. ✅ **Zapisywanie dokumentów i chunks do PostgreSQL (sync z Qdrant)**
11. ✅ **Frontend ładuje historię czatów z bazy (persistencja)**
12. ✅ **Protected routes z middleware authentication**

## Next Steps / TODOs

1. Dodać user profile management (zmiana hasła)
2. Dodać user dashboard z statystykami
3. Rozważyć WebSocket dla streaming responses
4. Dodać rate limiting i bezpieczeństwo API
5. Stworzyć production build workflow
6. Dodać batch upload dla dużych PDF (>100 stron)
7. Implementować usuwanie dokumentów z Qdrant

## Resources

- Frontend (Lovable): https://lovable.dev/projects/60862761-6587-4de9-b13e-9bc11e226285
- GitHub: https://github.com/Insomnai/rag-sample-49668
- LangChain Docs: https://js.langchain.com/
- Qdrant Docs: https://qdrant.tech/documentation/
