import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { config } from '../config/env.js';
import { createRetriever } from './retriever.js';

const DEFAULT_TEMPLATE = `Jesteś pomocnym asystentem AI. Użyj następującego kontekstu, aby odpowiedzieć na pytanie użytkownika.
Jeśli nie znasz odpowiedzi na podstawie kontekstu, powiedz że nie wiesz. Nie wymyślaj informacji.

Kontekst:
{context}

Pytanie: {question}

Odpowiedź:`;

export async function createRAGChain(vectorStore, options = {}) {
  const {
    modelName = 'gpt-3.5-turbo',
    temperature = 0.7,
    k = 4,
    promptTemplate = DEFAULT_TEMPLATE,
  } = options;

  const llm = new ChatOpenAI({
    openAIApiKey: config.openai.apiKey,
    modelName,
    temperature,
  });

  const retriever = createRetriever(vectorStore, { k });

  const prompt = PromptTemplate.fromTemplate(promptTemplate);

  const formatDocs = (docs) => {
    return docs.map((doc) => doc.pageContent).join('\n\n');
  };

  const chain = RunnableSequence.from([
    {
      context: async (input) => {
        const docs = await retriever.invoke(input.question);
        return formatDocs(docs);
      },
      question: (input) => input.question,
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return chain;
}

export async function createRAGChainWithSources(vectorStore, options = {}) {
  const {
    modelName = 'gpt-3.5-turbo',
    temperature = 0.7,
    k = 4,
    promptTemplate = DEFAULT_TEMPLATE,
  } = options;

  const llm = new ChatOpenAI({
    openAIApiKey: config.openai.apiKey,
    modelName,
    temperature,
  });

  const retriever = createRetriever(vectorStore, { k });

  const prompt = PromptTemplate.fromTemplate(promptTemplate);

  const formatDocs = (docs) => {
    return docs.map((doc) => doc.pageContent).join('\n\n');
  };

  const chain = RunnableSequence.from([
    {
      context: async (input) => {
        const docs = await retriever.invoke(input.question);
        input.sourceDocs = docs;
        return formatDocs(docs);
      },
      question: (input) => input.question,
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return {
    invoke: async (question) => {
      const input = { question };
      const answer = await chain.invoke(input);
      return {
        answer,
        sources: input.sourceDocs || [],
      };
    },
  };
}
