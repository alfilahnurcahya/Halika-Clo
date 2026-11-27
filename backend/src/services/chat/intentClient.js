import axios from 'axios';
import env from '../../config/env.js';

export const KNOWN_INTENTS = ['tanya_stok', 'tanya_ukuran', 'tanya_warna_bahan', 'di_luar_konteks', 'sapaan', 'rekomendasi'];

const client = axios.create({ timeout: env.ml.timeoutMs, headers: { 'Content-Type': 'application/json' } });

/**
 * Memanggil API model intent milik tim Gen AI (kontrak: docs/API_CONTRACT.md).
 * @returns {Promise<{intent: string, confidence: number, entities?: object} | null>} null jika layanan gagal
 */
export async function predictIntent(text) {
  if (!env.ml.url) return null;
  try {
    const { data } = await client.post(`${env.ml.url}/predict-intent`, { text });
    const intent = String(data?.intent || '').trim().toLowerCase();
    const confidence = Number(data?.confidence);
    if (!KNOWN_INTENTS.includes(intent) || !Number.isFinite(confidence)) {
      console.warn('[ml] Respons model tidak sesuai kontrak:', data);
      return null;
    }
    return { intent, confidence: Math.max(0, Math.min(1, confidence)), entities: data.entities || {} };
  } catch (err) {
    console.warn('[ml] Layanan model tidak dapat diakses:', err.code || err.message);
    return null;
  }
}
