import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AppError } from '../utils/response.js';

/** Menolak request tanpa token admin yang valid (401). */
export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Silakan login sebagai admin terlebih dahulu.');
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = { id: payload.sub, name: payload.name, email: payload.email, role: payload.role };
    next();
  } catch {
    throw new AppError(401, 'Sesi login berakhir atau tidak valid. Silakan login ulang.');
  }
};
