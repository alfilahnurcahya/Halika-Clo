import { AppError } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({ status: 'fail', message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ status: 'fail', message: err.message, errors: err.errors });
  }

  // Body JSON rusak
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'fail', message: 'Format JSON tidak valid.' });
  }

  // Duplikat (unique constraint MySQL)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ status: 'fail', message: 'Data sudah ada (duplikat). Periksa nama produk atau kombinasi ukuran-warna.' });
  }

  // Database tidak bisa dihubungi
  if (['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT', 'ER_ACCESS_DENIED_ERROR'].includes(err.code)) {
    console.error('[db]', err.code, err.message);
    return res.status(503).json({ status: 'error', message: 'Database sedang tidak dapat diakses. Coba lagi beberapa saat.' });
  }

  console.error('[error]', err);
  return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server. Coba lagi beberapa saat.' });
};
