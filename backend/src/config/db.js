import mysql from 'mysql2/promise';
import env from './env.js';

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  // Kolom DECIMAL dikembalikan sebagai number, bukan string
  decimalNumbers: true,
  ssl: env.db.ssl ? { rejectUnauthorized: true } : undefined,
});

export default pool;
