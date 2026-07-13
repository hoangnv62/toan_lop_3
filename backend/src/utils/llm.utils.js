import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENAI_API_KEY,
  timeout: 60000,
  maxRetries: 1,
});

const DEFAULT_MODEL = env.OPENAI_MODEL;
// Models tried in order: primary first, then any configured fallbacks.
const MODEL_CHAIN = [DEFAULT_MODEL, ...env.OPENAI_FALLBACK_MODELS];
const MAX_ATTEMPTS_PER_MODEL = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Free OpenRouter models are frequently rate-limited (429) upstream. Retry each
// model with exponential backoff, then fall through to the next configured
// model before giving up. Any non-429 error is thrown immediately.
async function createCompletion(baseParams, requestedModel) {
  const models = requestedModel ? [requestedModel] : MODEL_CHAIN;
  let lastError;

  for (const model of models) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        return await client.chat.completions.create({ ...baseParams, model });
      } catch (err) {
        lastError = err;
        if (err?.status !== 429) throw err;
        // 0.5s, 1s, 2s — leave the loop early on the last attempt.
        if (attempt < MAX_ATTEMPTS_PER_MODEL - 1) await sleep(500 * 2 ** attempt);
      }
    }
  }

  throw lastError;
}

export const streamChat = (messages, model = null) =>
  createCompletion({ messages, temperature: 0.7, stream: true }, model);

export const chatCompletion = async (messages, tools = null, model = null) => {
  const params = { messages, temperature: 0.3 };
  if (tools?.length) {
    params.tools = tools;
    params.tool_choice = 'auto';
  }
  const response = await createCompletion(params, model);
  return response.choices[0].message;
};

export const generateJSON = async (prompt, model = null) => {
  const response = await createCompletion(
    {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      top_p: 0.7,
      response_format: { type: 'json_object' },
    },
    model
  );
  const content = response.choices[0].message.content;
  return JSON.parse(content);
};
