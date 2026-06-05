import { ChatOpenAI } from '@langchain/openai';
import { env } from '../config/env.js';

const DEFAULT_MODEL = 'openai/gpt-oss-120b:free';

export const initChatModel = (model = DEFAULT_MODEL) => new ChatOpenAI({
  modelName: model,
  openAIApiKey: env.OPENROUTER_API_KEY,
  temperature: 0.1,
  topP: 0.7,
  timeout: 180000,
  maxRetries: 2,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
});

export const generateStructured = async (schema, prompt, model = DEFAULT_MODEL) => {
  const structuredModel = initChatModel(model).withStructuredOutput(schema, { method: 'json_mode' });
  return structuredModel.invoke(prompt);
};
