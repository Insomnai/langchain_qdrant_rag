import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: process.env.QDRANT_COLLECTION_NAME || 'langchain_rag_collection',
  },
};

export function validateConfig() {
  const errors = [];

  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY nie został ustawiony w pliku .env');
  }

  if (!config.qdrant.url) {
    errors.push('QDRANT_URL nie został ustawiony w pliku .env');
  }

  if (errors.length > 0) {
    console.error('❌ Błędy konfiguracji:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n💡 Skopiuj plik .env.example do .env i uzupełnij wymagane klucze API');
    return false;
  }

  return true;
}
