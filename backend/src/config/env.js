import 'dotenv/config';

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 5000),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'halika_clo',
    ssl: process.env.DB_SSL === 'true',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  ml: {
    url: (process.env.ML_API_URL || '').replace(/\/$/, ''),
    timeoutMs: toNumber(process.env.ML_API_TIMEOUT_MS, 5000),
    minConfidence: toNumber(process.env.ML_MIN_CONFIDENCE, 0.5),
  },

  llm: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    timeoutMs: toNumber(process.env.LLM_TIMEOUT_MS, 6000),
  },

  lowStockThreshold: toNumber(process.env.LOW_STOCK_THRESHOLD, 3),
};

if (!env.jwt.secret || env.jwt.secret.length < 16) {
  // Tidak menghentikan server agar mudah dicoba, tetapi wajib diisi saat deploy.
  console.warn('[env] JWT_SECRET kosong/terlalu pendek. Isi di file .env sebelum deploy!');
}

export default env;
