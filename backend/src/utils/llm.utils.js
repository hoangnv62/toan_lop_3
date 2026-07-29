import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { env } from '../config/env.js';

// SDK openai dùng node-fetch bên dưới, mà node-fetch không tự đọc HTTPS_PROXY.
// Sau proxy công ty, không gắn agent thì request ra openrouter.ai bị ETIMEDOUT.
// Môi trường không có proxy (vd Railway) thì agent là undefined — không đổi gì.
const proxyUrl = env.HTTPS_PROXY;

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENAI_API_KEY,
  timeout: 60000,
  maxRetries: 1,
  httpAgent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined,
});

// Đổi model qua OPENAI_MODEL trong .env — cố ý không cho caller chỉ định model.
const MAX_ATTEMPTS = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Free OpenRouter models are frequently rate-limited (429) upstream. Retry with
// exponential backoff before giving up. Any non-429 error is thrown immediately.
async function createCompletion(baseParams) {
  let lastError;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
       const result = await client.chat.completions.create({ ...baseParams, model: env.OPENAI_MODEL });
       console.log(result);
       return result;
    } catch (err) {
      lastError = err;
      if (err?.status !== 429) throw err;
      // 0.5s, 1s — leave the loop early on the last attempt.
      if (attempt < MAX_ATTEMPTS - 1) await sleep(500 * 2 ** attempt);
    }
  }

  throw lastError;
}

export const streamChat = (messages) =>
  createCompletion({ messages, temperature: 0.7, stream: true });

export const chatCompletion = async (messages, tools = null) => {
  const params = { messages, temperature: 0.3 };
  if (tools?.length) {
    params.tools = tools;
    params.tool_choice = 'auto';
  }
  const response = await createCompletion(params);
  return response.choices[0].message;
};

export const generateJSON = async (prompt) => {
  const response = await createCompletion({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    top_p: 0.7,
    response_format: { type: 'json_object' },
  });
  const content = response.choices[0].message.content;
  return JSON.parse(content);
};
