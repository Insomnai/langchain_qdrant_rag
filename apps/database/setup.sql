-- PostgreSQL Database Setup for RAG Application
-- Version: 1.0.0
-- Description: Complete database schema with all tables, indexes, views, and functions
-- 
-- Usage:
--   psql -U postgres -d your_database_name -f setup.sql
--
-- or with environment variable:
--   psql $DATABASE_URL -f setup.sql

\echo '=================================='
\echo 'RAG Application Database Setup'
\echo '=================================='
\echo ''

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\echo '✓ Extensions enabled'
\echo ''

-- ============================================
-- TABLES
-- ============================================

\echo 'Creating tables...'

\ir migrations/001_create_users.sql
\echo '  ✓ users'

\ir migrations/002_create_chat_sessions.sql
\echo '  ✓ chat_sessions'

\ir migrations/003_create_chat_messages.sql
\echo '  ✓ chat_messages'

\ir migrations/004_create_documents.sql
\echo '  ✓ documents'

\ir migrations/005_create_document_chunks.sql
\echo '  ✓ document_chunks'

\ir migrations/006_create_chat_message_sources.sql
\echo '  ✓ chat_message_sources'

\ir migrations/007_create_user_sessions.sql
\echo '  ✓ user_sessions'

\ir migrations/008_create_usage_stats.sql
\echo '  ✓ usage_stats'

\echo ''

-- ============================================
-- VIEWS
-- ============================================

\echo 'Creating views...'
\ir migrations/009_create_views.sql
\echo '  ✓ user_recent_chats'
\echo '  ✓ document_stats'
\echo '  ✓ user_activity_summary'
\echo ''

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

\echo 'Creating functions and triggers...'
\ir migrations/010_create_functions.sql
\echo '  ✓ Functions and triggers created'
\echo ''

-- ============================================
-- VERIFICATION
-- ============================================

\echo 'Verifying installation...'
\echo ''

SELECT 
  'Tables created: ' || COUNT(*)::TEXT AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

SELECT 
  'Views created: ' || COUNT(*)::TEXT AS status
FROM information_schema.views 
WHERE table_schema = 'public';

SELECT 
  'Functions created: ' || COUNT(*)::TEXT AS status
FROM information_schema.routines 
WHERE routine_schema = 'public';

\echo ''
\echo '=================================='
\echo '✅ Database setup completed!'
\echo '=================================='
\echo ''
\echo 'Next steps:'
\echo '1. Update your .env file with DATABASE_URL'
\echo '2. Configure OPENAI_API_KEY and QDRANT_URL'
\echo '3. Start your application: npm run dev'
\echo ''
