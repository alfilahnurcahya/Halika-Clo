/**
 * Menyusun jawaban chatbot dari DATA ASLI di database (template).
 * Semua angka stok, harga, ukuran, dan warna berasal dari katalog, bukan karangan model.
 */
import { formatRupiah } from '../../utils/text.js';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'];
const bySize = (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b);
const unique = (arr) => [...new Set(arr)];
const sameColor = (a, b) => a.toLowerCase() === b.toLowerCase();

const joinList = (items) => {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} dan ${items[items.length - 1]}`;
};

const toCard = (p) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  price: p.price,
  imageUrl: p.imageUrl,
  category: p.category,
  totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
});

const available = (variants) => variants.filter((v) => v.stock > 0);

/** "Oatmeal: S (4), M (6); Dusty Pink: M (3)" */
function describeStockByColor(variants) {
  const colors = unique(variants.map((v) => v.color));
  return colors
    .map((color) => {
      const parts = variants
        .filter((v) => v.color === color)
        .sort((a, b) => bySize(a.size, b.size))
        .map((v) => `${v.size} (${v.stock} pcs)`);
      return `${color}: ${parts.join(', ')}`;
    })
    .join('; ');
}

function answerStock(product, { size, color }) {
  const name = product.name;
  const ready = available(product.variants);

  if (ready.length === 0) {
    return `Mohon maaf Kak, ${name} saat ini sedang habis untuk semua ukuran dan warna. Kakak bisa cek produk lain di katalog ya.`;
  }

  if (size && color) {
    const v = product.variants.find((x) => x.size === size && sameColor(x.color, color));
    if (v && v.stock > 0) return `${name} ukuran ${size} warna ${v.color} masih tersedia ${v.stock} pcs, Kak. Harganya ${formatRupiah(product.price)}.`;
    const alt = ready.filter((x) => x.size === size).map((x) => `${x.color} (${x.stock} pcs)`);
    const base = v
      ? `Mohon maaf Kak, ${name} ukuran ${size} warna ${v.color} sedang habis.`
      : `Mohon maaf Kak, ${name} tidak tersedia dalam ukuran ${size} warna ${color}.`;
    return alt.length ? `${base} Untuk ukuran ${size} yang masih ada: ${joinList(alt)}.` : `${base} Stok yang tersedia: ${describeStockByColor(ready)}.`;
  }

  if (size) {
    const inSize = ready.filter((x) => x.size === size);
    if (inSize.length) {
      return `${name} ukuran ${size} masih tersedia: ${joinList(inSize.map((x) => `${x.color} ${x.stock} pcs`))}. Harganya ${formatRupiah(product.price)}.`;
    }
    const sizes = unique(ready.map((x) => x.size)).sort(bySize);
    return `Mohon maaf Kak, ${name} ukuran ${size} sedang tidak tersedia. Ukuran yang masih ada: ${joinList(sizes)}.`;
  }

  if (color) {
    const inColor = ready.filter((x) => sameColor(x.color, color));
    if (inColor.length) {
      return `${name} warna ${inColor[0].color} masih tersedia di ukuran ${joinList(inColor.sort((a, b) => bySize(a.size, b.size)).map((x) => `${x.size} (${x.stock} pcs)`))}.`;
    }
    const colors = unique(ready.map((x) => x.color));
    return `Mohon maaf Kak, ${name} warna ${color} sedang tidak tersedia. Warna yang masih ada: ${joinList(colors)}.`;
  }

  return `Stok ${name} saat ini — ${describeStockByColor(ready)}. Harganya ${formatRupiah(product.price)}.`;
}

function answerSize(product, { size, color }) {
  const ready = available(product.variants);
  const allSizes = unique(product.variants.map((v) => v.size)).sort(bySize);
  const readySizes = unique(ready.map((v) => v.size)).sort(bySize);
  const soldOut = allSizes.filter((s) => !readySizes.includes(s));

  if (size) return answerStock(product, { size, color });
  if (allSizes.length === 1 && allSizes[0] === 'All Size') {
    return `${product.name} hanya tersedia dalam All Size, Kak${ready.length ? '' : ', dan saat ini sedang habis'}.`;
  }
  let text = `${product.name} tersedia dalam ukuran ${joinList(allSizes)}.`;
  text += readySizes.length ? ` Yang ready saat ini: ${joinList(readySizes)}.` : ' Saat ini semua ukuran sedang habis.';
  if (soldOut.length && readySizes.length) text += ` Ukuran ${joinList(soldOut)} sedang habis.`;
  return text;
}

function answerColorMaterial(product, { color, size }) {
  const ready = available(product.variants);
  const colors = unique(product.variants.map((v) => v.color));
  const readyColors = unique(ready.map((v) => v.color));

  if (color) return `Bahan ${product.name} adalah ${product.material}. ${answerStock(product, { color, size })}`;

  let text = `${product.name} menggunakan bahan ${product.material}. Pilihan warnanya: ${joinList(colors)}.`;
  const out = colors.filter((c) => !readyColors.includes(c));
  if (out.length && readyColors.length) text += ` Warna ${joinList(out)} sedang habis.`;
  return text;
}

function answerProductSummary(product) {
  const ready = available(product.variants);
  const colors = unique(ready.map((v) => v.color));
  const sizes = unique(ready.map((v) => v.size)).sort(bySize);
  if (!ready.length) return `${product.name} (${formatRupiah(product.price)}) saat ini sedang habis, Kak.`;
  return `${product.name} berbahan ${product.material}, harga ${formatRupiah(product.price)}. Warna yang ready: ${joinList(colors)}; ukuran: ${joinList(sizes)}.`;
}

/** Cari produk dengan stok > 0 sesuai kategori/ukuran/warna. */
function recommend(catalog, { category, size, color }, limit = 3) {
  return catalog
    .filter((p) => !category || p.category === category)
    .map((p) => ({
      p,
      matched: p.variants.filter((v) => v.stock > 0 && (!size || v.size === size) && (!color || sameColor(v.color, color))),
    }))
    .filter((x) => x.matched.length > 0)
    .sort((a, b) => b.matched.reduce((s, v) => s + v.stock, 0) - a.matched.reduce((s, v) => s + v.stock, 0))
    .slice(0, limit)
    .map((x) => x.p);
}

function describeFilter({ category, size, color }) {
  const parts = [];
  if (category) parts.push(category.toLowerCase());
  if (color) parts.push(`warna ${color}`);
  if (size) parts.push(`ukuran ${size}`);
  return parts.join(' ');
}

export const OUT_OF_CONTEXT_REPLY =
  'Mohon maaf Kak, Halika Assistant hanya bisa membantu pertanyaan seputar produk Halika.Clo, seperti stok, ukuran, warna, dan bahan. Ada produk yang ingin Kakak tanyakan?';

export const GREETING_REPLY =
  'Halo Kak, selamat datang di Halika.Clo! Kakak bisa tanya stok, ukuran, warna, atau bahan produk. Contoh: "Aruna Linen Dress ukuran M masih ada?"';

export const CLARIFY_REPLY =
  'Maaf Kak, aku belum menangkap maksud pertanyaannya. Boleh diperjelas nama produk dan yang ingin ditanyakan (stok, ukuran, warna, atau bahan)?';

/**
 * @param {{ intent: string, lowConfidence?: boolean, entities: object, catalog: Array }} input
 * @returns {{ reply: string, products: Array }}
 */
export function composeAnswer({ intent, lowConfidence = false, entities, catalog }) {
  const { product, candidates = [], size, color, category, colorInCatalog } = entities;

  if (intent === 'di_luar_konteks') return { reply: OUT_OF_CONTEXT_REPLY, products: [] };
  if (intent === 'sapaan' && !product) return { reply: GREETING_REPLY, products: [] };

  if (!product && candidates.length > 1) {
    return {
      reply: `Maksud Kakak produk yang mana: ${joinList(candidates.map((c) => c.name))}?`,
      products: candidates.slice(0, 4).map(toCard),
    };
  }

  if (product) {
    if (lowConfidence) return { reply: answerProductSummary(product), products: [toCard(product)] };
    let reply;
    switch (intent) {
      case 'tanya_stok': reply = answerStock(product, { size, color }); break;
      case 'tanya_ukuran': reply = answerSize(product, { size, color }); break;
      case 'tanya_warna_bahan': reply = answerColorMaterial(product, { size, color }); break;
      default: reply = answerProductSummary(product);
    }
    return { reply, products: [toCard(product)] };
  }

  if (lowConfidence) return { reply: CLARIFY_REPLY, products: [] };

  // Tidak ada produk spesifik -> rekomendasi berdasarkan kategori/ukuran/warna
  if (category || size || color) {
    if (color && colorInCatalog === false) {
      const alt = recommend(catalog, { category, size, color: null });
      return {
        reply: `Mohon maaf Kak, saat ini belum ada ${describeFilter({ category, size, color })} di Halika.Clo.${alt.length ? ` Mungkin Kakak suka pilihan ini: ${joinList(alt.map((p) => p.name))}.` : ''}`,
        products: alt.map(toCard),
      };
    }
    const recs = recommend(catalog, { category, size, color });
    if (recs.length) {
      return {
        reply: `Ini pilihan ${describeFilter({ category, size, color })} yang masih ready, Kak: ${joinList(recs.map((p) => `${p.name} (${formatRupiah(p.price)})`))}.`,
        products: recs.map(toCard),
      };
    }
    return { reply: `Mohon maaf Kak, ${describeFilter({ category, size, color })} sedang tidak tersedia.`, products: [] };
  }

  const popular = recommend(catalog, {});
  return {
    reply: `Boleh sebutkan nama produk yang Kakak maksud? Beberapa produk yang sedang ready: ${joinList(popular.map((p) => p.name))}.`,
    products: popular.map(toCard),
  };
}
