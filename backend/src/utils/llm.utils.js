import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { env } from '../config/env.js';

// SDK openai dùng node-fetch bên dưới, mà node-fetch không tự đọc HTTPS_PROXY.
// Sau proxy công ty, không gắn agent thì request ra nhà cung cấp bị ETIMEDOUT.
// Môi trường không có proxy (vd Railway) thì agent là undefined — không đổi gì.
const proxyUrl = env.HTTPS_PROXY;

const client = new OpenAI({
  baseURL: env.OPENAI_BASE_URL,
  apiKey: env.OPENAI_API_KEY,
  timeout: 60000,
  maxRetries: 1,
  httpAgent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined,
});

// Đổi model qua OPENAI_MODEL trong .env — cố ý không cho caller chỉ định model.
const MAX_ATTEMPTS = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Free tiers are frequently rate-limited (429) upstream. Retry with exponential
// backoff before giving up. Any non-429 error is thrown immediately.
// Lưu ý: backoff này chỉ đủ cho 429 lẻ tẻ. Nhà cung cấp giới hạn theo phút
// (vd Cerebras free 5 RPM = 1 request/12s) thì phải nới MAX_ATTEMPTS/delay lên.
async function createCompletion(baseParams, signal, label) {
  let lastError;
  const startedAt = Date.now();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const attemptAt = Date.now();
    // Log TRƯỚC khi await: một request treo 60s phải nhìn thấy được ngay lúc nó
    // bắt đầu, chứ không phải đợi nó hỏng mới biết là đã gọi đi đâu.
    console.log(
      `[llm] ${label} attempt=${attempt + 1}/${MAX_ATTEMPTS} model=${env.OPENAI_MODEL} url=${env.OPENAI_BASE_URL} messages=${baseParams.messages.length} tools=${baseParams.tools?.length || 0}`
    );

    try {
      const result = await client.chat.completions.create(
        { ...baseParams, model: env.OPENAI_MODEL },
        { signal }
      );
      // Với stream=true, SDK trả về ngay khi mở được kết nối — duration ở đây là
      // thời gian bắt tay, còn độ trễ token đầu tiên do logStream() đo.
      console.log(`[llm] ${label} status=ok duration=${Date.now() - attemptAt}ms`);
      return result;
    } catch (err) {
      lastError = err;
      console.error(
        `[llm] ${label} status=error http=${err?.status ?? '-'} duration=${Date.now() - attemptAt}ms error=${err.message}`
      );
      // Người dùng bấm hủy → dừng ngay, đừng retry.
      if (signal?.aborted) throw err;
      if (err?.status !== 429) throw err;
      // 0.5s, 1s — leave the loop early on the last attempt.
      if (attempt < MAX_ATTEMPTS - 1) {
        const waitMs = 500 * 2 ** attempt;
        console.warn(`[llm] ${label} rate_limited retry_in=${waitMs}ms`);
        await sleep(waitMs);
      }
    }
  }

  console.error(`[llm] ${label} gave_up attempts=${MAX_ATTEMPTS} total=${Date.now() - startedAt}ms`);
  throw lastError;
}

// Bọc stream để đo độ trễ token đầu tiên — treo trước token đầu (kết nối/hàng đợi
// nhà cung cấp) và treo giữa chừng là hai lỗi khác nhau, log phải phân biệt được.
async function* logStream(stream, label, startedAt) {
  let firstTokenAt = null;
  let chunks = 0;

  try {
    for await (const chunk of stream) {
      if (firstTokenAt === null) {
        firstTokenAt = Date.now();
        console.log(`[llm] ${label} first_token=${firstTokenAt - startedAt}ms`);
      }
      chunks++;
      yield chunk;
    }
  } finally {
    // finally chứ không phải sau vòng lặp: người dùng bấm "Dừng" thì generator bị
    // đóng giữa chừng, vẫn phải biết đã stream được tới đâu.
    console.log(
      `[llm] ${label} stream_end chunks=${chunks} duration=${Date.now() - startedAt}ms first_token=${firstTokenAt ? firstTokenAt - startedAt : 'none'}`
    );
  }
}

export const streamChat = async (messages, signal, label = 'stream') => {
  const startedAt = Date.now();
  const stream = await createCompletion({ messages, temperature: 0.7, stream: true }, signal, label);
  return logStream(stream, label, startedAt);
};

export const chatCompletion = async (messages, tools = null, signal, label = 'chat') => {
  const params = { messages, temperature: 0.3 };
  if (tools?.length) {
    params.tools = tools;
    params.tool_choice = 'auto';
  }
  const response = await createCompletion(params, signal, label);
  const message = response.choices[0].message;
  const toolNames = message.tool_calls?.map((tc) => tc.function.name).join(',') || 'none';
  console.log(
    `[llm] ${label} reply tool_calls=${toolNames} content_len=${message.content?.length || 0}`
  );
  return message;
};

export const generateJSON = async (prompt, label = 'json') => {
  const response = await createCompletion(
    {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      top_p: 0.7,
      response_format: { type: 'json_object' },
    },
    undefined,
    label
  );
  const content = response.choices[0].message.content;
  return JSON.parse(content);
};
