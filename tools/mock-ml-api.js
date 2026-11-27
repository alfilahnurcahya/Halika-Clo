/**
 * MOCK API model intent — HANYA untuk pengembangan Full-Stack sebelum model
 * tim Gen AI siap. Mengikuti kontrak docs/API_CONTRACT.md.
 * Jangan dipakai sebagai model utama saat penilaian (model asli = scikit-learn tim Gen AI).
 *
 *   node tools/mock-ml-api.js        -> http://localhost:8000/predict-intent
 */
import http from 'node:http';
import { classifyByKeywords } from '../backend/src/services/chat/fallbackIntent.js';

const PORT = Number(process.env.MOCK_ML_PORT || 8000);

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { status: 'ok', mock: true });
  if (req.method !== 'POST' || req.url !== '/predict-intent') return send(res, 404, { detail: 'Not found' });

  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', () => {
    try {
      const { text } = JSON.parse(raw || '{}');
      if (typeof text !== 'string' || !text.trim()) return send(res, 422, { detail: 'text wajib diisi' });
      const { intent } = classifyByKeywords(text);
      // Confidence acak tinggi agar alur normal backend teruji
      return send(res, 200, { intent, confidence: Number((0.75 + Math.random() * 0.2).toFixed(2)) });
    } catch {
      return send(res, 400, { detail: 'JSON tidak valid' });
    }
  });
});

server.listen(PORT, () => console.log(`Mock ML API: http://localhost:${PORT}/predict-intent`));
