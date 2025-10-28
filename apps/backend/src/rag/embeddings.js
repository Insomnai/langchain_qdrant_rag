import { OpenAIEmbeddings } from '@langchain/openai';
import { config } from '../config/env.js';

export function createEmbeddings() {
  return new OpenAIEmbeddings({
    openAIApiKey: config.openai.apiKey,
    modelName: 'text-embedding-3-small',
  });
}
