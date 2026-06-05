import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENAI_API_KEY,
  timeout: 60000,
  maxRetries: 1,
});

const DEFAULT_MODEL = 'openai/gpt-oss-120b:free';

export const streamChat = async (messages, model = DEFAULT_MODEL) => {
  return client.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    stream: true,
  });
};

export const generateJSON = async (prompt, model = DEFAULT_MODEL) => {
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    top_p: 0.7,
    response_format: { type: 'json_object' },
  });
  const content = response.choices[0].message.content;
  return JSON.parse(content);
};
