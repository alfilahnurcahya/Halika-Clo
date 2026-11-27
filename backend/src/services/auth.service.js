import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import env from '../config/env.js';
import { AppError } from '../utils/response.js';

const toUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export async function login({ email, password }) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  const user = rows[0];
  // Pesan sama untuk email/password salah agar tidak membocorkan email yang terdaftar
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError(401, 'Email atau password salah.');
  }
  const token = jwt.sign(
    { sub: user.id, name: user.name, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
  return { token, user: toUser(user) };
}

export async function getMe(id) {
  const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError(401, 'Akun tidak ditemukan. Silakan login ulang.');
  return toUser(rows[0]);
}
