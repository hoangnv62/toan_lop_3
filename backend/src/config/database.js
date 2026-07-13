import * as mariadb from 'mariadb';
import { env } from './env.js';

const pool = mariadb.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 10,
  namedPlaceholders: true,
  insertIdAsNumber: true,
  bigIntAsNumber: true,
  dateStrings: false,
  // MySQL 8 `caching_sha2_password` refuses to send the password over an
  // unencrypted channel without the server's RSA public key. We allow public
  // key retrieval so auth works against Railway MySQL over plain TCP; set
  // DB_SSL=true additionally if the server exposes TLS.
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
  allowPublicKeyRetrieval: true,
});

export const query = (sql, params) => pool.query(sql, params);

export const queryOne = async (sql, params) => {
  const rows = await pool.query(sql, params);
  return rows[0] ?? null;
};

export const insert = async (sql, params) => {
  const result = await pool.query(sql, params);
  return result.insertId;
};

export const batchInsert = (sql, params) => pool.batch(sql, params);

export const transaction = async (callback) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};
