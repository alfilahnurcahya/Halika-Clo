/**
 * Membuat database + tabel dari database/schema.sql.
 *   npm run db:init         -> hanya tabel (PERINGATAN: menghapus tabel lama!)
 *   npm run db:init:seed    -> tabel + data contoh (dummy)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import env from '../src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(__dirname, '..', '..', 'database');
const withSeed = process.argv.includes('--seed');

const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  multipleStatements: true,
  ssl: env.db.ssl ? { rejectUnauthorized: true } : undefined,
});

try {
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${env.db.database}\``);
  await conn.query(await fs.readFile(path.join(dbDir, 'schema.sql'), 'utf8'));
  console.log('✔ Tabel berhasil dibuat');
  if (withSeed) {
    await conn.query(await fs.readFile(path.join(dbDir, 'seed.sql'), 'utf8'));
    console.log('✔ Data contoh (dummy) berhasil dimasukkan');
  }
  console.log('Selanjutnya buat akun admin: npm run seed:admin');
} catch (err) {
  console.error('✖ Gagal menyiapkan database:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
