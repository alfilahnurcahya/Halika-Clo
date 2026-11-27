/**
 * Klasifikasi intent CADANGAN berbasis kata kunci.
 * BUKAN pengganti model intent tim Gen AI — hanya dipakai ketika API model
 * tidak dapat dihubungi (timeout / mati), agar chatbot tetap bisa melayani.
 * Setiap hasilnya dicatat di chat_logs dengan intent_source = 'fallback'.
 */
import { normalize } from '../../utils/text.js';
import { extractSize } from './entityExtractor.js';

const has = (text, words) => words.some((w) => new RegExp(`\\b${w}\\b`).test(text));

const STOCK = ['stok', 'stock', 'ready', 'ready stock', 'tersedia', 'sisa', 'habis', 'available', 'restock', 'masih ada', 'masih', 'ada'];
const SIZE = ['ukuran', 'size', 'uk', 'lingkar', 'ld', 'muat', 'bb', 'berat badan', 'jumbo', 'all size', 'allsize', 'fit'];
const COLOR_MATERIAL = ['warna', 'color', 'colour', 'bahan', 'material', 'kain', 'adem', 'tebal', 'tipis', 'panas', 'nerawang', 'menerawang', 'melar'];
const GREETING = ['halo', 'hallo', 'hai', 'hi', 'hello', 'assalamualaikum', 'permisi', 'pagi', 'siang', 'sore', 'malam', 'min', 'kak'];
const RECOMMEND = ['rekomendasi', 'rekomen', 'saran', 'cocok', 'recommend', 'pilihan', 'kondangan', 'kerja', 'kantor', 'lebaran', 'budget', 'murah'];
const SHOP_CONTEXT = ['baju', 'dress', 'gamis', 'atasan', 'blouse', 'kemeja', 'tunik', 'kulot', 'celana', 'rok', 'outer', 'cardigan', 'set', 'setelan', 'hijab', 'produk', 'katalog', 'koleksi'];

/**
 * @param {string} text
 * @param {{ productMentioned?: boolean }} [context]
 * @returns {{ intent: string, confidence: number }}
 */
export function classifyByKeywords(text, context = {}) {
  const t = normalize(text);
  const productMentioned = Boolean(context.productMentioned);

  const isStock = has(t, STOCK);
  const isSize = has(t, SIZE) || Boolean(extractSize(t));
  const isColorMaterial = has(t, COLOR_MATERIAL);
  const isRecommend = has(t, RECOMMEND);
  const isShop = has(t, SHOP_CONTEXT) || productMentioned;

  if (isColorMaterial && !isStock) return { intent: 'tanya_warna_bahan', confidence: 0.6 };
  if (isSize && !isStock) return { intent: 'tanya_ukuran', confidence: 0.6 };
  if (isStock && (isShop || isSize || isColorMaterial)) return { intent: 'tanya_stok', confidence: 0.6 };
  if (isRecommend && isShop) return { intent: 'rekomendasi', confidence: 0.6 };
  if (productMentioned) return { intent: 'tanya_stok', confidence: 0.55 };
  if (isShop) return { intent: 'rekomendasi', confidence: 0.55 };

  const words = t.split(' ').filter(Boolean);
  if (has(t, GREETING) && words.length <= 4) return { intent: 'sapaan', confidence: 0.6 };

  return { intent: 'di_luar_konteks', confidence: 0.6 };
}
