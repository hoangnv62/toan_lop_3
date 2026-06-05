import 'dotenv/config';

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT) || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  DB_NAME: process.env.DB_NAME || 'math_learning',
  SECRET_KEY: process.env.SECRET_KEY || 'math_secret_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
};
