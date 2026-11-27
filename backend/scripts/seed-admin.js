/**
 * Membuat / memperbarui akun admin dari variabel .env:
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD  (opsional ADMIN_ROLE=owner|co_owner)
 * Password tidak pernah ditulis ke repository.
 */
import bcrypt from 'bcryptjs';
import pool from '../src/config/db.js';

const name = process.env.ADMIN_NAME || 'Owner Halika';
const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || '';
const role = process.env.ADMIN_ROLE === 'co_owner' ? 'co_owner' : 'owner';

if (!email || password.length < 8) {
  console.error('✖ Isi ADMIN_EMAIL dan ADMIN_PASSWORD (minimal 8 karakter) di file .env terlebih dahulu.');
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = VALUES(role)`,
    [name, email, hash, role],
  );
  console.log(`✔ Akun admin siap: ${email} (${role})`);
} catch (err) {
  console.error('✖ Gagal membuat admin:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
