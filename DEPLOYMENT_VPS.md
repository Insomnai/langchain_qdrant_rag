# 🚀 Deployment RAG Application na VPS - Kompletny Przewodnik

Ten przewodnik przeprowadzi Cię przez **pełną instalację** aplikacji RAG na własnym serwerze VPS od zera do działającej aplikacji produkcyjnej.

---

## ⚡ SZYBKI START: Aktualizacja Aplikacji (Git Pull)

**Jeśli aplikacja już działa na VPS i chcesz tylko zaktualizować kod:**

```bash
# 1. Połącz się z VPS
ssh root@62.169.26.253  # lub ssh twoj_user@62.169.26.253

# 2. Przejdź do folderu aplikacji
cd /var/www/rag-app

# 3. Zatrzymaj aplikację
pm2 stop all

# 4. Pobierz najnowsze zmiany z GitHub
git pull origin main

# 5. Zainstaluj nowe dependencies (jeśli były zmiany)
npm install

# 6. Przebuduj frontend (jeśli były zmiany w UI)
npm run build --workspace=apps/frontend

# 7. Zrestartuj aplikację
pm2 restart all
pm2 save

# 8. Sprawdź czy działa
pm2 logs --lines 30
```

**✅ Gotowe!** Aplikacja zaktualizowana.

**⚠️ UWAGA:** Twój plik `.env` z kluczami API zostanie zachowany - Git go nie nadpisuje (jest w `.gitignore`).

---

## 📖 Pełna Instalacja od Zera

**Jeśli instalujesz aplikację po raz pierwszy, przejdź do sekcji poniżej:**

---

## 📋 Wymagania

### VPS Server
- **OS**: Ubuntu 22.04 LTS / 20.04 LTS (zalecane)
- **RAM**: Minimum 2GB (4GB zalecane)
- **CPU**: 2 vCPU
- **Disk**: 20GB SSD
- **Dostęp**: SSH z prawami root/sudo

### Klucze API
- **OpenAI API Key** - https://platform.openai.com/api-keys
- **Qdrant Cloud** (opcjonalnie) - https://cloud.qdrant.io/

---

## 📦 Co zainstalujemy?

1. ✅ **System** - Updates, firewall, podstawowe narzędzia
2. ✅ **PostgreSQL** - Baza danych relacyjna
3. ✅ **Qdrant** - Baza wektorowa (Docker lub Cloud)
4. ✅ **Node.js 20 LTS** - Runtime dla aplikacji
5. ✅ **Projekt** - Upload i konfiguracja kodu
6. ✅ **PM2** - Process manager dla Node.js
7. ✅ **Nginx** - Reverse proxy i SSL
8. ✅ **SSL/HTTPS** - Certyfikaty Let's Encrypt

---

## 🔧 KROK 1: Przygotowanie VPS

### 1.1 Połącz się z VPS przez SSH

```bash
ssh root@your_server_ip
# lub
ssh ubuntu@your_server_ip
```

### 1.2 Update systemu

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Zainstaluj podstawowe narzędzia

```bash
sudo apt install -y curl wget git build-essential ufw vim
```

### 1.4 Konfiguracja Firewall (UFW)

```bash
# Włącz firewall
sudo ufw enable

# Zezwól na SSH (WAŻNE - najpierw!)
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp

# Zezwól na HTTP i HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Sprawdź status
sudo ufw status
```

### 1.5 Utwórz użytkownika aplikacji (opcjonalne, ale zalecane)

```bash
# Utwórz użytkownika
sudo adduser ragapp

# Dodaj do sudo
sudo usermod -aG sudo ragapp

# Przełącz się na użytkownika
su - ragapp
```

---

## 🗄️ KROK 2: Instalacja PostgreSQL

### 2.1 Zainstaluj PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

### 2.2 Sprawdź status

```bash
sudo systemctl status postgresql
sudo systemctl enable postgresql  # Auto-start przy restarcie
```

### 2.3 Utwórz bazę danych i użytkownika

```bash
# Przełącz się na użytkownika postgres
sudo -u postgres psql

# W konsoli PostgreSQL:
CREATE DATABASE rag_app;
CREATE USER rag_user WITH ENCRYPTED PASSWORD 'twoje_silne_haslo_tutaj';
GRANT ALL PRIVILEGES ON DATABASE rag_app TO rag_user;

# Daj uprawnienia dla schematu public (PostgreSQL 15+)
\c rag_app
GRANT ALL ON SCHEMA public TO rag_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rag_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rag_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rag_user;

# Wyjdź z PostgreSQL
\q
```

### 2.4 Konfiguracja dostępu (opcjonalnie - jeśli potrzebujesz remote access)

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
# Znajdź linię: listen_addresses = 'localhost'
# Zmień na: listen_addresses = '*'  # Lub konkretny IP

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Dodaj na końcu:
# host    rag_app    rag_user    0.0.0.0/0    md5

sudo systemctl restart postgresql
```

### 2.5 Testuj połączenie

```bash
psql -U rag_user -d rag_app -h localhost
# Hasło: twoje_silne_haslo_tutaj

# W psql:
SELECT version();
\q
```

---

## 🔍 KROK 3: Instalacja Qdrant

Masz **dwie opcje**: Docker (local) lub Qdrant Cloud.

### Opcja A: Qdrant przez Docker (Zalecane dla VPS)

#### 3.1 Zainstaluj Docker

```bash
# Usuń stare wersje
sudo apt remove docker docker-engine docker.io containerd runc

# Dodaj Docker repository
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Dodaj użytkownika do grupy docker
sudo usermod -aG docker $USER

# Zastosuj zmiany (lub wyloguj się i zaloguj ponownie)
newgrp docker

# Sprawdź instalację
docker --version
docker run hello-world
```

#### 3.2 Uruchom Qdrant

```bash
# Utwórz folder dla danych Qdrant
mkdir -p ~/qdrant_storage

# Uruchom Qdrant
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v ~/qdrant_storage:/qdrant/storage \
  --restart unless-stopped \
  qdrant/qdrant

# Sprawdź status
docker ps
docker logs qdrant

# Test API
curl http://localhost:6333
```

#### 3.3 Konfiguracja Firewall dla Qdrant (jeśli potrzebujesz remote access)

```bash
# UWAGA: Otwieraj tylko jeśli musisz!
sudo ufw allow 6333/tcp
```

**Ustawienia .env:**
```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
```

---

### Opcja B: Qdrant Cloud (Łatwiejsze, ale płatne)

1. Zarejestruj się na https://cloud.qdrant.io/
2. Utwórz nowy cluster (Free tier: 1GB RAM)
3. Skopiuj **Cluster URL** i **API Key**

**Ustawienia .env:**
```env
QDRANT_URL=https://xyz-abc-123.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=twoj_qdrant_cloud_api_key
```

---

## 📦 KROK 4: Instalacja Node.js 20 LTS

### 4.1 Zainstaluj Node.js przez NodeSource

```bash
# Dodaj NodeSource repository dla Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Zainstaluj Node.js
sudo apt install -y nodejs

# Sprawdź wersje
node --version   # powinno pokazać v20.x.x
npm --version    # powinno pokazać 10.x.x
```

### 4.2 Zainstaluj PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Sprawdź instalację
pm2 --version
```

---

## 📂 KROK 5: Upload Projektu na VPS

Masz **dwie opcje**: Git clone lub ZIP upload.

### Opcja A: Git Clone (Zalecane)

```bash
# Jeśli projekt jest na GitHubie
cd ~
git clone https://github.com/twoj-username/rag-fullstack-monorepo.git
cd rag-fullstack-monorepo
```

### Opcja B: Upload ZIP przez SCP

**Na swoim komputerze (lokalnie):**
```bash
# Spakuj projekt (bez node_modules!)
zip -r rag-app.zip . -x "node_modules/*" -x ".git/*"

# Upload na VPS
scp rag-app.zip user@your_server_ip:~/
```

**Na VPS:**
```bash
cd ~
unzip rag-app.zip -d rag-fullstack-monorepo
cd rag-fullstack-monorepo
```

---

## 🔨 KROK 6: Uruchomienie Migracji PostgreSQL

### 6.1 Przejdź do folderu database

```bash
cd ~/rag-fullstack-monorepo/apps/database
```

### 6.2 Uruchom setup.sql

```bash
psql -U rag_user -d rag_app -h localhost -f setup.sql
# Podaj hasło gdy zostaniesz poproszony
```

**Powinieneś zobaczyć:**
```
==================================
RAG Application Database Setup
==================================

✓ Extensions enabled

Creating tables...
  ✓ users
  ✓ chat_sessions
  ✓ chat_messages
  ✓ documents
  ✓ document_chunks
  ✓ chat_message_sources
  ✓ user_sessions
  ✓ usage_stats

Creating views...
  ✓ user_recent_chats
  ✓ document_stats
  ✓ user_activity_summary

Creating functions and triggers...
  ✓ Functions and triggers created

==================================
✅ Database setup completed!
==================================
```

### 6.3 Weryfikacja

```bash
psql -U rag_user -d rag_app -h localhost

# W psql:
\dt                    # Lista tabel (powinno być 8)
\dv                    # Lista widoków (powinno być 3)
SELECT * FROM users;   # Powinno być puste
\q
```

---

## ⚙️ KROK 7: Konfiguracja .env

### 7.1 Utwórz plik .env w root projektu

```bash
cd ~/rag-fullstack-monorepo
nano .env
```

### 7.2 Wklej konfigurację (UZUPEŁNIJ SWOJE KLUCZE!)

```env
# ====================================
# PRODUCTION CONFIGURATION
# ====================================

# OpenAI API Key (WYMAGANE)
OPENAI_API_KEY=sk-proj-TWOJ_PRAWDZIWY_KLUCZ_TUTAJ

# Qdrant Vector Database
# Opcja 1: Local Docker
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Opcja 2: Qdrant Cloud
# QDRANT_URL=https://xyz-abc.cloud.qdrant.io:6333
# QDRANT_API_KEY=twoj_qdrant_cloud_key

QDRANT_COLLECTION_NAME=langchain_rag_collection

# PostgreSQL Database
DATABASE_URL=postgresql://rag_user:twoje_haslo_postgresql@localhost:5432/rag_app

# Application Server
PORT=3000
NODE_ENV=production
```

**Zapisz:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 7.3 Uprawnienia do .env

```bash
chmod 600 .env   # Tylko owner może czytać/zapisywać
```

---

## 🚀 KROK 8: Instalacja Dependencies i Build

### 8.1 Zainstaluj wszystkie dependencies

```bash
cd ~/rag-fullstack-monorepo

# Zainstaluj dependencies (root + workspaces)
npm install
```

### 8.2 Build frontend dla produkcji

```bash
npm run build --workspace=apps/frontend
```

**To stworzy folder:** `apps/frontend/dist` z zbudowanym frontendem.

---

## 🔄 KROK 9: Uruchomienie Aplikacji z PM2

### 9.1 Utwórz plik ecosystem.config.js dla PM2

```bash
nano ecosystem.config.js
```

**Wklej:**
```javascript
module.exports = {
  apps: [
    {
      name: 'rag-backend',
      cwd: './apps/backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      max_restarts: 10,
      watch: false
    }
  ]
};
```

### 9.2 Uruchom aplikację przez PM2

```bash
# Utwórz folder dla logów
mkdir -p logs

# Uruchom PM2
pm2 start ecosystem.config.js

# Sprawdź status
pm2 status

# Zobacz logi (pokazuje logi na żywo)
pm2 logs rag-backend --lines 50
```

**⚠️ WAŻNE:** Komenda `pm2 logs` pokazuje logi **na żywo** i nie kończy się automatycznie.  
Po zobaczeniu logów (backend uruchomiony, baza podłączona, RAG gotowy) **wciśnij `Ctrl + C`** aby wyjść i kontynuować.

```bash
# Teraz dopiero te komendy (po Ctrl+C):
# Auto-start przy restarcie serwera
pm2 startup
pm2 save
```

### 9.3 Testuj backend

```bash
curl http://localhost:3000/api/health
```

**Powinieneś zobaczyć:**
```json
{
  "status": "ok",
  "backend": true,
  "qdrant": true,
  "database": true,
  "message": "All systems operational"
}
```

---

## 🌐 KROK 10: Konfiguracja Nginx (Reverse Proxy + SSL)

### 10.1 Zainstaluj Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 10.2 Utwórz konfigurację Nginx

```bash
sudo nano /etc/nginx/sites-available/rag-app
```

**Wklej (ZAMIEŃ `your_domain.com` na swoją domenę!):**

```nginx
# Frontend + Backend Reverse Proxy
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    # Frontend (static files)
    location / {
        root /home/ragapp/rag-fullstack-monorepo/apps/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts dla długich requestów (RAG)
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Max upload size (dla PDF)
        client_max_body_size 50M;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 10.3 Aktywuj konfigurację

```bash
# Symlink do sites-enabled
sudo ln -s /etc/nginx/sites-available/rag-app /etc/nginx/sites-enabled/

# Usuń default config
sudo rm /etc/nginx/sites-enabled/default

# Test konfiguracji
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 10.4 Testuj aplikację

Otwórz przeglądarkę:
```
http://your_domain.com          # Frontend
http://your_domain.com/api/health  # Backend API
```

---

## 🔒 KROK 11: SSL/HTTPS z Let's Encrypt (Certbot)

### 11.1 Zainstaluj Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 11.2 Wygeneruj certyfikat SSL

```bash
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```

**Postępuj zgodnie z instrukcjami:**
- Podaj email
- Zaakceptuj Terms of Service
- Wybierz opcję przekierowania HTTP → HTTPS (2)

### 11.3 Auto-renewal

```bash
# Certbot automatycznie dodaje cron job
# Sprawdź czy działa:
sudo certbot renew --dry-run
```

### 11.4 Testuj HTTPS

```
https://your_domain.com
```

---

## ✅ KROK 12: Weryfikacja Finalna

### 12.1 Checklist końcowy

```bash
# 1. PostgreSQL działa
sudo systemctl status postgresql

# 2. Qdrant działa
docker ps | grep qdrant
curl http://localhost:6333

# 3. Backend działa
pm2 status
curl http://localhost:3000/api/health

# 4. Nginx działa
sudo systemctl status nginx
curl https://your_domain.com/api/health

# 5. SSL aktywny
curl -I https://your_domain.com | grep -i "200 OK"
```

### 12.2 Sprawdź logi

```bash
# Backend logs
pm2 logs rag-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Qdrant logs
docker logs qdrant
```

---

## 🛠️ Przydatne Komendy PM2

```bash
# Status aplikacji
pm2 status

# Logi (live)
pm2 logs rag-backend

# Restart aplikacji
pm2 restart rag-backend

# Stop aplikacji
pm2 stop rag-backend

# Start aplikacji
pm2 start rag-backend

# Usuń z PM2
pm2 delete rag-backend

# Monitoring
pm2 monit
```

---

## 🔄 Update Aplikacji (Deployment)

### Opcja 1: Git Pull

```bash
cd ~/rag-fullstack-monorepo

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild frontend
npm run build --workspace=apps/frontend

# Restart backend
pm2 restart rag-backend
```

### Opcja 2: Upload nowego ZIP

```bash
# Backup obecnej wersji
cd ~
mv rag-fullstack-monorepo rag-fullstack-monorepo.backup

# Upload i unzip nowego kodu
unzip rag-app-new.zip -d rag-fullstack-monorepo
cd rag-fullstack-monorepo

# Skopiuj .env
cp ~/rag-fullstack-monorepo.backup/.env .

# Install + build
npm install
npm run build --workspace=apps/frontend

# Restart
pm2 restart rag-backend
```

---

## 🆘 Troubleshooting

### Problem: Backend nie startuje

```bash
# Sprawdź logi
pm2 logs rag-backend --lines 100

# Sprawdź czy port 3000 jest zajęty
sudo netstat -tulpn | grep 3000

# Sprawdź .env
cat .env | grep -v "^#"
```

### Problem: Database connection failed

```bash
# Sprawdź PostgreSQL
sudo systemctl status postgresql

# Test połączenia
psql -U rag_user -d rag_app -h localhost

# Sprawdź DATABASE_URL w .env
echo $DATABASE_URL
```

### Problem: Qdrant not connected

```bash
# Sprawdź Docker
docker ps
docker logs qdrant

# Test API
curl http://localhost:6333

# Restart Qdrant
docker restart qdrant
```

### Problem: Nginx 502 Bad Gateway

```bash
# Sprawdź czy backend działa
pm2 status
curl http://localhost:3000/api/health

# Sprawdź Nginx error log
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t
```

### Problem: SSL not working

```bash
# Sprawdź certyfikaty
sudo certbot certificates

# Renew ręcznie
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

### Problem: Upload plików nie działa (413 Payload Too Large)

```bash
# Zwiększ limit w Nginx
sudo nano /etc/nginx/sites-available/rag-app

# Dodaj:
client_max_body_size 100M;

# Restart
sudo systemctl restart nginx
```

---

## 📊 Monitoring i Maintenance

### Daily Checks

```bash
# Sprawdź czy wszystko działa
pm2 status
docker ps
sudo systemctl status postgresql nginx

# Sprawdź dysk
df -h

# Sprawdź RAM
free -h
```

### Weekly Maintenance

```bash
# Update systemu
sudo apt update && sudo apt upgrade -y

# Sprawdź logi
pm2 logs --lines 100

# Backup bazy danych
pg_dump -U rag_user rag_app > backup_$(date +%Y%m%d).sql
```

### Monthly Tasks

```bash
# Cleanup Docker
docker system prune -a

# Sprawdź certyfikaty SSL
sudo certbot certificates

# Analiza logów Nginx
sudo goaccess /var/log/nginx/access.log
```

---

## 🎉 Gotowe!

Twoja aplikacja RAG powinna teraz działać na:

```
https://your_domain.com
```

### Next Steps

1. Zaimplementuj authentication (users, login)
2. Dodaj rate limiting
3. Setup monitoring (Prometheus + Grafana)
4. Skonfiguruj backupy automatyczne
5. Rozważ CDN dla static assets

---

## 🔄 ODŚWIEŻENIE APLIKACJI PO ZMIANACH W KODZIE

**UWAGA: Jeśli usunąłeś bazę danych lub tabele, zobacz sekcję "PEŁNE ODŚWIEŻENIE" poniżej!**

Gdy wprowadzisz zmiany w kodzie na Replit i chcesz je wdrożyć na VPS:

### Metoda 1: Git Pull (ZALECANE - najszybsze)

```bash
# 1. Połącz się z VPS
ssh root@62.169.26.253

# 2. Przejdź do folderu aplikacji
cd /var/www/rag-app

# 3. Zatrzymaj aplikację
pm2 stop all

# 4. Pobierz zmiany z GitHub
git pull origin main

# 5. Zainstaluj nowe zależności (jeśli były)
npm install

# 6. Przebuduj frontend (jeśli były zmiany)
npm run build --workspace=apps/frontend

# 7. Uruchom aplikację
pm2 restart all
pm2 save

# 8. Sprawdź logi
pm2 logs --lines 30
```

### Metoda 2: Pobierz ZIP i Upload (dla większych zmian)

1. **Pobierz ZIP z Replit**
   - Kliknij trzy kropki (...) obok nazwy projektu w Replit
   - Wybierz "Download as ZIP"
   - Zapisz plik na swoim komputerze

2. **Upload na VPS**
   ```bash
   # Na swoim komputerze (z folderu gdzie jest ZIP)
   scp rag-app.zip user@62.169.26.253:/tmp/
   ```

3. **Zainstaluj zmiany na VPS**
   ```bash
   # Połącz się z VPS
   ssh user@62.169.26.253
   
   # Zatrzymaj aplikację
   pm2 stop all
   
   # Backup obecnej wersji
   cd /var/www
   cp -r rag-app rag-app-backup-$(date +%Y%m%d-%H%M%S)
   
   # Rozpakuj nową wersję
   cd /tmp
   unzip -o rag-app.zip -d rag-app-new
   
   # Skopiuj pliki (zachowaj .env!)
   cp /var/www/rag-app/.env /tmp/.env.backup
   rm -rf /var/www/rag-app/*
   mv rag-app-new/* /var/www/rag-app/
   mv /tmp/.env.backup /var/www/rag-app/.env
   
   # Zainstaluj zależności
   cd /var/www/rag-app
   npm install
   
   # Uruchom migrations jeśli były zmiany w bazie
   psql -d klient_rag -f apps/database/setup.sql  # Tylko jeśli nowe tabele
   psql -d klient_rag -f apps/database/seeds/001_create_admin_user.sql  # Tylko przy pierwszej instalacji
   
   # Restart aplikacji
   pm2 restart all
   pm2 save
   
   # Sprawdź logi
   pm2 logs --lines 50
   ```

### Metoda 2: Git Pull (Zalecane dla małych zmian)

Jeśli używasz Git repository:

```bash
# Połącz się z VPS
ssh user@62.169.26.253

# Przejdź do folderu aplikacji
cd /var/www/rag-app

# Zatrzymaj aplikację
pm2 stop all

# Pobierz zmiany
git pull origin main

# Zainstaluj nowe zależności (jeśli były)
npm install

# Restart aplikacji
pm2 restart all
pm2 save

# Sprawdź logi
pm2 logs --lines 20
```

### Metoda 3: Tylko Backend ALBO Frontend

**Aktualizacja tylko backendu:**
```bash
pm2 stop rag-backend
cd /var/www/rag-app/apps/backend
npm install  # jeśli były zmiany w dependencies
pm2 restart rag-backend
```

**Aktualizacja tylko frontendu:**
```bash
pm2 stop rag-frontend
cd /var/www/rag-app/apps/frontend
npm install  # jeśli były zmiany w dependencies
npm run build  # rebuild static files
pm2 restart rag-frontend
```

### ⚠️ UWAGA: Zachowaj .env!

Zawsze upewnij się że **NIE nadpisujesz** pliku `.env` z VPS! Zawiera on Twoje prawdziwe klucze API i hasła do bazy.

```bash
# Backup .env przed każdą aktualizacją
cp /var/www/rag-app/.env /var/www/rag-app/.env.backup
```

### Sprawdzenie czy działa

```bash
# Sprawdź status PM2
pm2 status

# Zobacz logi
pm2 logs --lines 50

# Test w przeglądarce
curl http://localhost:3000/api/health
curl http://localhost:5000
```

### Rollback w razie problemu

```bash
# Zatrzymaj aplikację
pm2 stop all

# Przywróć backup
rm -rf /var/www/rag-app
mv /var/www/rag-app-backup-TIMESTAMP /var/www/rag-app

# Restart
pm2 restart all
```

---

## 🔄 PEŁNE ODŚWIEŻENIE APLIKACJI (gdy usunąłeś bazę danych)

**Użyj tego TYLKO jeśli:**
- Usunąłeś bazę danych `klient_rag`
- Usunąłeś użytkownika `klientsql` z PostgreSQL
- Aplikacja nie może się połączyć z bazą

### Krok 1: Zatrzymaj aplikację

```bash
ssh root@62.169.26.253
cd /var/www/rag-app
pm2 stop all
```

### Krok 2: Utwórz bazę danych i użytkownika ponownie

```bash
# Połącz się z PostgreSQL jako postgres
sudo -u postgres psql

# W konsoli PostgreSQL:
CREATE DATABASE klient_rag;
CREATE USER klientsql WITH ENCRYPTED PASSWORD 'glutamina22';
GRANT ALL PRIVILEGES ON DATABASE klient_rag TO klientsql;

# Podłącz się do bazy
\c klient_rag

# Daj uprawnienia
GRANT ALL ON SCHEMA public TO klientsql;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO klientsql;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO klientsql;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO klientsql;

# Wyjdź
\q
```

### Krok 3: Uruchom migrations (stwórz tabele)

```bash
cd /var/www/rag-app
psql -U klientsql -d klient_rag -h localhost -f apps/database/setup.sql
```

**Podaj hasło:** `glutamina22`

**Powinieneś zobaczyć:**
```
==================================
RAG Application Database Setup
==================================

✓ Extensions enabled

Creating tables...
  ✓ users
  ✓ chat_sessions
  ✓ chat_messages
  ✓ documents
  ✓ document_chunks
  ✓ chat_message_sources
  ✓ user_sessions
  ✓ usage_stats

Creating views...
  ✓ user_recent_chats
  ✓ document_stats
  ✓ user_activity_summary

Creating functions and triggers...
  ✓ Functions and triggers created

==================================
✅ Database setup completed!
==================================
```

### Krok 4: Uruchom migration fix (WAŻNE!)

```bash
psql -U klientsql -d klient_rag -h localhost -f apps/database/migrations/011_fix_chat_message_sources.sql
```

**Podaj hasło:** `glutamina22`

**Powinieneś zobaczyć:**
```
✅ chat_message_sources table fixed successfully
   - Old schema with document_chunk_id removed
   - New schema with source_content and source_metadata created
   - Views recreated
```

### Krok 5: Utwórz admin usera

```bash
psql -U klientsql -d klient_rag -h localhost -f apps/database/seeds/001_create_admin_user.sql
```

**Podaj hasło:** `glutamina22`

**Powinieneś zobaczyć:**
```
✅ Admin user created successfully
   Email: admin@example.com
   Password: admin123
   ⚠️  SECURITY: CHANGE THIS PASSWORD AFTER FIRST LOGIN!
```

### Krok 6: Zrestartuj aplikację

```bash
pm2 restart all
pm2 save
pm2 logs --lines 30
```

### Krok 7: Testuj login

```bash
# Test API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Powinieneś zobaczyć:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@example.com"
  },
  "token": "..."
}
```

### Krok 8: Otwórz aplikację w przeglądarce

1. Idź na `http://62.169.26.253` (lub swoją domenę)
2. Zaloguj się:
   - Email: `admin@example.com`
   - Hasło: `admin123`

**✅ Gotowe!** Aplikacja działa.

---

## 📚 Dodatkowe Zasoby

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/getting-started/)

---

**Pytania? Problemy?**  
Sprawdź sekcję Troubleshooting lub logi aplikacji dla szczegółowych informacji.
