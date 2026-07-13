import 'dotenv/config';

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
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
