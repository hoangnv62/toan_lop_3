import 'dotenv/config';

// Gemini cũng có lớp tương thích OpenAI, nên dùng chung openai SDK.
// Đặt GEMINI_API_KEY là chuyển hẳn sang Gemini, bỏ qua bộ OPENAI_* — để người
// dùng không phải xóa cấu hình OpenRouter cũ mỗi lần đổi nhà cung cấp.
const GEMINI_DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const useGemini = Boolean(geminiApiKey);

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT) || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  // Ép cứng tên database — bỏ qua biến DB_NAME/MYSQLDATABASE do môi trường
  // (vd Railway cấp sẵn "railway") tiêm vào, luôn dùng math_learning.
  DB_NAME: 'math_learning',
  DB_SSL: process.env.DB_SSL === 'true',
  SECRET_KEY: process.env.SECRET_KEY || 'math_secret_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  // Nhà cung cấp AI nào cũng được miễn tương thích OpenAI — chỉ cần đổi 3 biến
  // trong .env là chuyển được, không phải sửa code. Có GEMINI_API_KEY thì dùng
  // Gemini, không thì dùng bộ OPENAI_* (mặc định OpenRouter).
  AI_PROVIDER: useGemini ? 'gemini' : 'openai',
  AI_API_KEY: useGemini ? geminiApiKey : process.env.OPENAI_API_KEY || '',
  AI_MODEL: useGemini
    ? process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
    : process.env.OPENAI_MODEL,
  AI_BASE_URL: useGemini
    ? process.env.GEMINI_BASE_URL || GEMINI_DEFAULT_BASE_URL
    : process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
  // Proxy đi ra internet (mạng công ty). Bỏ trống khi chạy ở môi trường
  // không cần proxy. Nhận cả 2 kiểu viết vì shell/CI đặt biến khác nhau.
  HTTPS_PROXY: process.env.HTTPS_PROXY || process.env.https_proxy || '',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
