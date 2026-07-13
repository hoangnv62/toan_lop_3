import 'dotenv/config';
import * as mysql from 'mariadb';
import { env } from '../src/config/env.js';
import {
  TABLE_STATEMENTS,
  addUserClassForeignKey,
  seedSampleData,
} from './schema.js';

// Manual reset script: DROPS the database and rebuilds it from scratch with
// fresh demo data. Destructive — run only when you want a clean slate.
// For non-destructive auto-setup on app startup, see database/init-db.js.
async function main() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
      allowPublicKeyRetrieval: env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL,
    });

    await conn.query(`DROP DATABASE IF EXISTS \`${env.DB_NAME}\``);
    await conn.query(
      `CREATE DATABASE \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.query(`USE \`${env.DB_NAME}\``);

    for (const statement of TABLE_STATEMENTS) {
      await conn.query(statement);
    }
    await addUserClassForeignKey(conn, env.DB_NAME);
    await seedSampleData(conn);

    console.log('>>> Database tạo thành công!');
    console.log('    Giáo viên : gv1 / 123');
    console.log('    Học sinh  : hs1 / 123  |  hs2 / 123');
  } catch (err) {
    console.error('Lỗi:', err);
  } finally {
    if (conn) conn.end();
  }
}

main();
