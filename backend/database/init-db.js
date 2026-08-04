import * as mariadb from 'mariadb';
import { env } from '../src/config/env.js';
import {
  TABLE_STATEMENTS,
  addUserClassForeignKey,
  enforceQuestionBankLessonNotNull,
  seedSampleData,
} from './schema.js';

// Runs once on app startup: if the target database doesn't exist yet, create it
// along with every table (and demo data). Idempotent — safe to run on every
// boot, so nothing is dropped or duplicated on restarts.
export async function initializeDatabase() {
  // Connect WITHOUT selecting a database — the database may not exist yet.
  const conn = await mariadb.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
    allowPublicKeyRetrieval: true,
  });

  try {
    const [existing] = await conn.query(
      'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
      [env.DB_NAME]
    );

    if (!existing) {
      // Database name can't be parameterized; it comes from trusted env config.
      await conn.query(
        `CREATE DATABASE \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`>>> Đã tạo database "${env.DB_NAME}"`);
    }

    await conn.query(`USE \`${env.DB_NAME}\``);

    for (const statement of TABLE_STATEMENTS) {
      await conn.query(statement);
    }
    await addUserClassForeignKey(conn, env.DB_NAME);
    await enforceQuestionBankLessonNotNull(conn, env.DB_NAME);

    // Seed demo data only when the schema is brand new (no users yet).
    const [{ userCount }] = await conn.query('SELECT COUNT(*) AS userCount FROM users');
    if (Number(userCount) === 0) {
      await seedSampleData(conn);
      console.log('>>> Đã tạo dữ liệu mẫu (gv1/123, hs1/123, hs2/123)');
    }

    console.log(`>>> Database "${env.DB_NAME}" sẵn sàng.`);
  } finally {
    await conn.end();
  }
}
