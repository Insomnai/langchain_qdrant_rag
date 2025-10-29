import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

export function createDatabasePool() {
  if (pool) {
    return pool;
  }

  const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? {
          rejectUnauthorized: false
        } : false,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'rag_app',
        user: process.env.DB_USER || 'rag_user',
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? {
          rejectUnauthorized: false
        } : false,
      };

  pool = new Pool({
    ...connectionConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
  });

  pool.on('connect', () => {
    console.log('✅ New database connection established');
  });

  return pool;
}

export async function testDatabaseConnection() {
  try {
    const dbPool = createDatabasePool();
    const result = await dbPool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected:', {
      time: result.rows[0].current_time,
      version: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1],
    });
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

export async function closeDatabasePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 Database pool closed');
  }
}

export function getPool() {
  if (!pool) {
    return createDatabasePool();
  }
  return pool;
}

process.on('SIGINT', async () => {
  await closeDatabasePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabasePool();
  process.exit(0);
});
