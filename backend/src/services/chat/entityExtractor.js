/**
 * Ekstraksi produk, ukuran, warna, dan kategori dari pertanyaan pelanggan.
 * Dicocokkan dengan data katalog TERBARU dari database, sehingga produk/warna
 * baru yang ditambahkan admin langsung dikenali tanpa melatih ulang model.
 */
import { normalize } from '../../utils/text.js';

// Kata umum di nama produk yang tidak cukup untuk mengenali satu produk
const GENERIC_TOKENS = new Set([
  'dress', 'blouse', 'set', 'daily', 'basic', 'pants', 'skirt', 'outer', 'tunik', 'kulot', 'rok',
  'atasan', 'cardigan', 'hijab', 'top', 'shirt', 'kemeja', 'celana', 'the', 'and', 'series', 'collection',
]);

const COMMON_COLORS = [
  'hitam', 'putih', 'merah', 'biru', 'hijau', 'kuning', 'coklat', 'cokelat', 'cream', 'krem', 'navy',
  'maroon', 'abu', 'abu abu', 'pink', 'ungu', 'sage', 'mocca', 'mocha', 'beige', 'oatmeal', 'olive',
  'lilac', 'mint', 'tosca', 'orange', 'oranye', 'dusty pink', 'broken white', 'champagne', 'terracotta',
];

const CATEGORY_WORDS = {
  Dress: ['dress', 'gamis', 'gaun'],
  Atasan: ['atasan', 'blouse', 'blus', 'tunik', 'kemeja', 'kaos', 'top'],
  Bawahan: ['bawahan', 'kulot', 'rok', 'celana', 'skirt', 'pants'],
  Set: ['set', 'setelan', 'one set', 'couple'],
  Outer: ['outer', 'cardigan', 'kardigan', 'blazer', 'jaket'],
  Hijab: ['hijab', 'kerudung', 'jilbab', 'pashmina'],
};

const containsPhrase = (text, phrase) => new RegExp(`(^|\\s)${phrase}(\\s|$)`).test(text);

function levenshtein(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

/** Toleransi salah ketik 1 huruf untuk kata >= 5 huruf (mis. "kirana" vs "kiranna"). */
const tokenMatches = (msgTokens, token) =>
  msgTokens.some((m) => m === token || (token.length >= 5 && m.length >= 5 && levenshtein(m, token) <= 1));

export function extractSize(text) {
  const t = normalize(text);
  if (/\ball ?size\b|\ballsize\b/.test(t)) return 'All Size';
  const explicit = t.match(/\b(?:ukuran|size|uk|sz)\s*(xxl|xl|xs|s|m|l)\b/);
  if (explicit) return explicit[1].toUpperCase();
  const loose = t.match(/\b(xxl|xl|xs)\b/) || t.match(/\b(s|m|l)\b/);
  return loose ? loose[1].toUpperCase() : null;
}

export function extractColor(text, catalogColors = []) {
  const t = normalize(text);
  // Warna dari katalog dulu (nama persis yang dipakai di database), frasa terpanjang lebih dulu
  const fromCatalog = [...new Set(catalogColors)].sort((a, b) => b.length - a.length);
  for (const color of fromCatalog) {
    if (containsPhrase(t, normalize(color))) return { value: color, inCatalog: true };
  }
  const common = [...COMMON_COLORS].sort((a, b) => b.length - a.length);
  for (const color of common) {
    if (containsPhrase(t, color)) {
      // Samakan sinonim dengan nama warna di katalog jika ada (krem -> Cream)
      const synonyms = { krem: 'cream', cokelat: 'coklat', mocha: 'mocca', oranye: 'orange', 'abu abu': 'abu' };
      const canonical = synonyms[color] || color;
      const match = catalogColors.find((c) => normalize(c) === canonical);
      if (match) return { value: match, inCatalog: true };
      return { value: color.replace(/\b\w/g, (c) => c.toUpperCase()), inCatalog: false };
    }
  }
  return null;
}

export function extractCategory(text) {
  const t = normalize(text);
  for (const [category, words] of Object.entries(CATEGORY_WORDS)) {
    if (words.some((w) => containsPhrase(t, w))) return category;
  }
  return null;
}

/**
 * @param {string} text
 * @param {Array} catalog - produk aktif lengkap dengan varian
 */
export function extractProducts(text, catalog = []) {
  const t = normalize(text);
  const msgTokens = t.split(' ').filter(Boolean);

  const scored = catalog
    .map((product) => {
      const name = normalize(product.name);
      if (containsPhrase(t, name)) return { product, score: 100 };
      const tokens = name.split(' ').filter((tok) => tok.length >= 3);
      let score = 0;
      let distinctive = 0;
      for (const tok of tokens) {
        if (tokenMatches(msgTokens, tok)) {
          if (GENERIC_TOKENS.has(tok)) score += 0.5;
          else { score += 2; distinctive += 1; }
        }
      }
      return { product, score: distinctive > 0 ? score : 0 };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { product: null, candidates: [] };
  const best = scored[0].score;
  const top = scored.filter((s) => s.score === best).map((s) => s.product);
  return { product: top.length === 1 ? top[0] : null, candidates: top };
}

export function extractEntities(text, catalog = []) {
  const catalogColors = catalog.flatMap((p) => p.variants.map((v) => v.color));
  const { product, candidates } = extractProducts(text, catalog);
  const color = extractColor(text, catalogColors);
  return {
    product,
    candidates,
    size: extractSize(text),
    color: color?.value || null,
    colorInCatalog: color?.inCatalog ?? null,
    category: product ? product.category : extractCategory(text),
  };
}
