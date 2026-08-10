import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { env } from '../config/env.js';

// SDK openai dùng node-fetch bên dưới, mà node-fetch không tự đọc HTTPS_PROXY.
// Sau proxy công ty, không gắn agent thì request ra nhà cung cấp bị ETIMEDOUT.
// Môi trường không có proxy (vd Railway) thì agent là undefined — không đổi gì.
const proxyUrl = env.HTTPS_PROXY;

const client = new OpenAI({
  baseURL: env.AI_BASE_URL,
  apiKey: env.AI_API_KEY,
  timeout: 60000,
  // 0 chứ không phải 1: lần thử lại của SDK bắn ngay gần như tức thì và bỏ qua
  // RetryInfo, nên với 5 RPM nó chỉ đốt thêm một lượt gọi rồi vẫn 429. Việc thử
  // lại do createCompletion() dưới đây lo, vì chỉ ở đó mới đọc được RetryInfo.
  maxRetries: 0,
  httpAgent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined,
});

// Gemini trả lỗi bọc trong một mảng — [{ "error": {...} }] — còn SDK openai chỉ
// hiểu dạng { "error": {...} }: nó làm body['error'] trên mảng nên ra undefined,
// mất sạch cả thông báo lẫn RetryInfo, log chỉ còn "429 status code (no body)".
// Gỡ vỏ mảng trước khi SDK đọc body.
//
// fetch lấy từ chính client (node-fetch, hiểu option `agent`) — dùng fetch global
// của Node thì httpAgent ở trên bị bỏ qua và request chết ở proxy công ty.
const sdkFetch = client.fetch;
client.fetch = async (url, init) => {
  const response = await sdkFetch(url, init);
  // Chỉ đọc body khi lỗi: đọc ở nhánh thành công sẽ tiêu mất stream SSE.
  if (response.ok) return response;

  const text = await response.text();
  let body = text;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) body = JSON.stringify(parsed[0]);
  } catch {
    // Không phải JSON (vd trang lỗi HTML của proxy) — để nguyên cho SDK báo thô.
  }
  // response.constructor: đúng lớp Response của SDK, không phải bản global.
  return new response.constructor(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

// Đổi model qua .env (OPENAI_MODEL / GEMINI_MODEL) — cố ý không cho caller
// chỉ định model.
//
// Bậc miễn phí giới hạn theo phút nên 429 là chuyện thường, không phải ngoại lệ.
// Đo thực tế trên Gemini free: gemini-3.6-flash 5 RPM, gemini-3.5-flash-lite
// 15 RPM. Một lượt chat có tool tốn 2–4 lượt gọi, sinh 50 câu hỏi tốn 5 lượt.
const MAX_ATTEMPTS = 4;
// Tổng thời gian được phép nằm chờ giữa các lần thử. Người dùng đang đợi trước
// màn hình, nên hết ngân sách thì báo lỗi luôn chứ không ngủ thêm vô ích.
const RETRY_BUDGET_MS = 45000;
const MAX_SLEEP_MS = 30000;

// Hủy giữa lúc đang chờ thì phải dừng ngay: chờ tới 30s mà không nghe abort
// nghĩa là người dùng bấm "Dừng" xong vẫn phải ngồi đợi hết khoảng đó.
const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new Error('Aborted'));
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason ?? new Error('Aborted'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });

// Google nói thẳng phải chờ bao lâu trong details: { "@type": ".../RetryInfo",
// "retryDelay": "9s" }. Chờ đúng khoảng đó thay vì đoán bằng backoff.
const suggestedRetryMs = (err) => {
  const details = err?.error?.details;
  if (!Array.isArray(details)) return null;
  const info = details.find((d) => String(d?.['@type']).endsWith('google.rpc.RetryInfo'));
  const seconds = parseFloat(info?.retryDelay);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
};

// Any non-429 error is thrown immediately.
async function createCompletion(baseParams, signal, label) {
  let lastError;
  const startedAt = Date.now();
  let waitedMs = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const attemptAt = Date.now();
    // Log TRƯỚC khi await: một request treo 60s phải nhìn thấy được ngay lúc nó
    // bắt đầu, chứ không phải đợi nó hỏng mới biết là đã gọi đi đâu.
    console.log(
      `[llm] ${label} attempt=${attempt + 1}/${MAX_ATTEMPTS} provider=${env.AI_PROVIDER} model=${env.AI_MODEL} url=${env.AI_BASE_URL} messages=${baseParams.messages.length} tools=${baseParams.tools?.length || 0}`
    );

    try {
      const result = await client.chat.completions.create(
        { ...baseParams, model: env.AI_MODEL },
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
      if (attempt === MAX_ATTEMPTS - 1) break;

      const suggested = suggestedRetryMs(err);
      // Jitter: sinh câu hỏi bắn nhiều chunk song song, cùng 429 rồi cùng thử
      // lại đúng một thời điểm thì lại 429 tiếp — phải làm chúng lệch nhau.
      const jitterMs = Math.floor(Math.random() * 1000);
      // Không có RetryInfo (nhà cung cấp khác) thì quay về backoff 1s, 2s, 4s.
      const waitMs = Math.min((suggested ?? 1000 * 2 ** attempt) + jitterMs, MAX_SLEEP_MS);

      // Hết ngân sách chờ thì dừng luôn — ngủ thêm rồi vẫn hỏng chỉ làm người
      // dùng đợi lâu hơn để nhận cùng một lỗi.
      if (waitedMs + waitMs > RETRY_BUDGET_MS) {
        console.error(
          `[llm] ${label} gave_up reason=retry_budget waited=${waitedMs}ms next_wait=${waitMs}ms`
        );
        break;
      }

      console.warn(
        `[llm] ${label} rate_limited retry_in=${waitMs}ms source=${suggested ? 'server' : 'backoff'} waited=${waitedMs + waitMs}/${RETRY_BUDGET_MS}ms`
      );
      await sleep(waitMs, signal);
      waitedMs += waitMs;
    }
  }

  console.error(
    `[llm] ${label} gave_up attempts=${MAX_ATTEMPTS} total=${Date.now() - startedAt}ms waited=${waitedMs}ms`
  );
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

// Ghép delta tool_calls của stream thành danh sách hoàn chỉnh. Hai nhà cung cấp
// gửi khác nhau, phải chịu được cả hai:
//   - OpenAI/OpenRouter: `arguments` bị chẻ ra nhiều delta, ghép lại theo `index`
//   - Gemini: gửi trọn một tool call trong một delta và KHÔNG có `index`
// Thiếu `index` thì lấy "có function.name" làm dấu hiệu một tool call mới, còn
// delta không tên là phần tiếp của cái cuối — nếu coi delta nào cũng là mới thì
// bên OpenRouter mỗi mảnh arguments thành một tool call rác.
const mergeToolCallDeltas = (toolCalls, deltas = []) => {
  for (const delta of deltas) {
    let slot = delta.index;
    if (slot === undefined) slot = delta.function?.name ? toolCalls.length : toolCalls.length - 1;
    if (slot < 0) slot = 0;

    toolCalls[slot] ??= { id: '', type: 'function', function: { name: '', arguments: '' } };
    const call = toolCalls[slot];
    if (delta.id) call.id = delta.id;
    if (delta.function?.name) call.function.name = delta.function.name;
    if (delta.function?.arguments) call.function.arguments += delta.function.arguments;
    // Gemini 3.x đính thought_signature trong extra_content và BẮT BUỘC nhận lại
    // nguyên vẹn ở lượt sau, thiếu là 400 "Function call is missing a
    // thought_signature". Gọi kiểu không stream thì SDK trả sẵn nguyên message,
    // còn ghép tay từ delta thì phải chủ động giữ.
    if (delta.extra_content) call.extra_content = delta.extra_content;
  }
  return toolCalls;
};

// Stream kèm tool: đẩy token chữ ra ngoài ngay khi nhận (onToken) và trả về
// message hoàn chỉnh, cùng shape với message mà SDK trả về khi không stream.
//
// Vì sao cần: trước đây một lượt chat "thường" tốn 2 lượt gọi — một lượt hỏi xem
// có cần tool không (câu trả lời sinh ra rồi bỏ đi) rồi một lượt stream lại y
// hệt. Bậc miễn phí chỉ có 15 lượt/phút nên đó là nửa ngân sách bị đốt vô ích.
// Gọi thẳng dạng stream có kèm tool thì vừa còn 1 lượt, vừa giữ được chạy chữ.
export const streamChatWithTools = async (messages, tools, signal, label, onToken) => {
  const startedAt = Date.now();
  // 0.3 chứ không phải 0.7 như streamChat: lượt này vừa phải
  // chọn tool vừa rút tham số từ câu người dùng, cần chắc tay hơn là bay bổng.
  const params = { messages, temperature: 0.3, stream: true };
  if (tools?.length) {
    params.tools = tools;
    params.tool_choice = 'auto';
  }
  const stream = await createCompletion(params, signal, label);

  const toolCalls = [];
  let content = '';
  for await (const chunk of logStream(stream, label, startedAt)) {
    const delta = chunk?.choices?.[0]?.delta;
    if (!delta) continue;
    if (delta.content) {
      content += delta.content;
      onToken?.(delta.content);
    }
    if (delta.tool_calls) mergeToolCallDeltas(toolCalls, delta.tool_calls);
  }

  const toolNames = toolCalls.map((tc) => tc.function.name).join(',') || 'none';
  console.log(`[llm] ${label} reply tool_calls=${toolNames} content_len=${content.length}`);

  const message = { role: 'assistant', content: content || null };
  if (toolCalls.length) message.tool_calls = toolCalls;
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
