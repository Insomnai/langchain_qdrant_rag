# PostgreSQL Database Setup

Kompletny schemat bazy danych PostgreSQL dla aplikacji RAG.

## 📦 Zawartość

```
database/
├── migrations/           # Poszczególne pliki SQL dla każdej tabeli/funkcji
│   ├── 001_create_users.sql
│   ├── 002_create_chat_sessions.sql
│   ├── 003_create_chat_messages.sql
│   ├── 004_create_documents.sql
│   ├── 005_create_document_chunks.sql
│   ├── 006_create_chat_message_sources.sql
│   ├── 007_create_user_sessions.sql
│   ├── 008_create_usage_stats.sql
│   ├── 009_create_views.sql
│   └── 010_create_functions.sql
├── seeds/                # Opcjonalne dane testowe
├── setup.sql            # Główny plik - uruchamia wszystkie migrations
└── README.md            # Ten plik
```

## 🚀 Instalacja na VPS

### Krok 1: Instalacja PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**CentOS/RHEL:**
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Krok 2: Tworzenie bazy danych

```bash
# Przełącz się na użytkownika postgres
sudo -u postgres psql

# W konsoli PostgreSQL:
CREATE DATABASE rag_app;
CREATE USER rag_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE rag_app TO rag_user;
\q
```

### Krok 3: Uruchomienie migrations

**Opcja A: Jeden plik (zalecane)**
```bash
cd apps/database
psql -U rag_user -d rag_app -f setup.sql
```

**Opcja B: Z environment variable**
```bash
# Ustaw DATABASE_URL w .env
export DATABASE_URL="postgresql://rag_user:password@localhost:5432/rag_app"

# Uruchom migrations
psql $DATABASE_URL -f setup.sql
```

**Opcja C: Poszczególne migrations (rozwój)**
```bash
cd apps/database/migrations
for file in *.sql; do
  echo "Running $file..."
  psql -U rag_user -d rag_app -f "$file"
done
```

## 🔧 Konfiguracja .env

Dodaj do głównego pliku `.env`:

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://rag_user:your_password@localhost:5432/rag_app

# Lub osobne zmienne:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rag_app
DB_USER=rag_user
DB_PASSWORD=your_secure_password
DB_SSL=false
```

## 📊 Schemat Bazy Danych

### Główne Tabele

1. **users** - Konta użytkowników
2. **chat_sessions** - Sesje rozmów
3. **chat_messages** - Wiadomości w czatach
4. **documents** - Przesłane dokumenty
5. **document_chunks** - Chunki dokumentów (sync z Qdrant)
6. **chat_message_sources** - Źródła użyte w odpowiedziach
7. **user_sessions** - Sesje logowania
8. **usage_stats** - Statystyki użycia

### Widoki (Views)

- **user_recent_chats** - Ostatnie rozmowy z liczbą wiadomości
- **document_stats** - Statystyki dokumentów z cytatowaniami
- **user_activity_summary** - Podsumowanie aktywności użytkowników

### Funkcje

- **update_updated_at_column()** - Auto-update timestamp
- **cleanup_expired_sessions()** - Czyszczenie wygasłych sesji
- **update_chat_session_on_message()** - Update sesji przy nowej wiadomości
- **increment_document_chunk_count()** - Licznik chunków

## 🧪 Weryfikacja instalacji

```sql
-- Sprawdź wszystkie tabele
\dt

-- Sprawdź widoki
\dv

-- Sprawdź funkcje
\df

-- Zlicz rekordy (powinno być 0 na początku)
SELECT 
  'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'chat_sessions', COUNT(*) FROM chat_sessions
UNION ALL
SELECT 'documents', COUNT(*) FROM documents;
```

## 🔄 Przydatne komendy

### Backup bazy danych
```bash
pg_dump -U rag_user rag_app > backup_$(date +%Y%m%d).sql
```

### Restore z backup
```bash
psql -U rag_user -d rag_app < backup_20251029.sql
```

### Reset całej bazy (UWAGA: usuwa wszystkie dane!)
```bash
psql -U postgres -c "DROP DATABASE rag_app;"
psql -U postgres -c "CREATE DATABASE rag_app;"
psql -U rag_user -d rag_app -f setup.sql
```

### Czyszczenie wygasłych sesji
```sql
SELECT cleanup_expired_sessions();
```

## 📈 Optymalizacja produkcyjna

### Recommended PostgreSQL settings dla VPS:

```conf
# /etc/postgresql/14/main/postgresql.conf

shared_buffers = 256MB           # 25% RAM dla małego VPS
effective_cache_size = 1GB       # 50% RAM
work_mem = 16MB
maintenance_work_mem = 64MB
max_connections = 100
```

Po zmianach:
```bash
sudo systemctl restart postgresql
```

## 🔒 Bezpieczeństwo

### 1. Ustaw silne hasło
```sql
ALTER USER rag_user WITH PASSWORD 'very_strong_random_password_here';
```

### 2. Konfiguracja pg_hba.conf
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Dodaj (zastąp trust przez md5):
local   rag_app   rag_user   md5
host    rag_app   rag_user   127.0.0.1/32   md5
```

### 3. Restart PostgreSQL
```bash
sudo systemctl restart postgresql
```

## 🆘 Troubleshooting

### Problem: "psql: command not found"
```bash
# Ubuntu/Debian
sudo apt install postgresql-client

# macOS
brew install postgresql
```

### Problem: "FATAL: role does not exist"
```bash
# Utwórz użytkownika ponownie
sudo -u postgres createuser -P rag_user
```

### Problem: "connection refused"
```bash
# Sprawdź czy PostgreSQL działa
sudo systemctl status postgresql

# Sprawdź port
sudo netstat -plnt | grep 5432
```

## 📚 Więcej informacji

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg) Documentation](https://node-postgres.com/)
- [Qdrant + PostgreSQL Integration](https://qdrant.tech/documentation/)
