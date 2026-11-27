/**
 * Unit test logika chatbot (tanpa database & tanpa jaringan).
 * Jalankan: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractEntities, extractSize } from '../src/services/chat/entityExtractor.js';
import { composeAnswer, OUT_OF_CONTEXT_REPLY } from '../src/services/chat/answerComposer.js';
import { classifyByKeywords } from '../src/services/chat/fallbackIntent.js';
import { isFaithful } from '../src/services/chat/llmGuard.js';

const catalog = [
  {
    id: 1, name: 'Aruna Linen Dress', slug: 'aruna-linen-dress', category: 'Dress', material: 'Linen', price: 489000, imageUrl: null,
    variants: [
      { id: 1, size: 'S', color: 'Oatmeal', stock: 4 },
      { id: 2, size: 'M', color: 'Oatmeal', stock: 6 },
      { id: 3, size: 'L', color: 'Dusty Pink', stock: 0 },
      { id: 4, size: 'M', color: 'Dusty Pink', stock: 3 },
    ],
  },
  {
    id: 2, name: 'Senja Pleated Blouse', slug: 'senja-pleated-blouse', category: 'Atasan', material: 'Katun Rayon', price: 329000, imageUrl: null,
    variants: [
      { id: 5, size: 'M', color: 'Putih', stock: 7 },
      { id: 6, size: 'XL', color: 'Hitam', stock: 2 },
    ],
  },
  {
    id: 3, name: 'Kirana Floral Dress', slug: 'kirana-floral-dress', category: 'Dress', material: 'Rayon', price: 529000, imageUrl: null,
    variants: [{ id: 7, size: 'M', color: 'Sage', stock: 5 }],
  },
];

const ask = (intent, text) => composeAnswer({ intent, entities: extractEntities(text, catalog), catalog });

test('mengenali produk, ukuran, dan warna', () => {
  const e = extractEntities('kak aruna linen ukuran M warna dusty pink ready?', catalog);
  assert.equal(e.product?.id, 1);
  assert.equal(e.size, 'M');
  assert.equal(e.color, 'Dusty Pink');
});

test('toleransi salah ketik satu huruf', () => {
  assert.equal(extractEntities('kiranna floral masih ada?', catalog).product?.id, 3);
});

test('kata umum "dress" saja tidak dianggap produk tertentu', () => {
  const e = extractEntities('ada dress warna sage?', catalog);
  assert.equal(e.product, null);
  assert.equal(e.category, 'Dress');
  assert.equal(e.color, 'Sage');
});

test('ekstraksi ukuran', () => {
  assert.equal(extractSize('size xl ada?'), 'XL');
  assert.equal(extractSize('yang all size'), 'All Size');
  assert.equal(extractSize('halo kak'), null);
});

test('jawaban stok memakai angka dari database', () => {
  const { reply } = ask('tanya_stok', 'aruna M oatmeal ada?');
  assert.match(reply, /6 pcs/);
});

test('stok habis menawarkan alternatif', () => {
  const { reply } = ask('tanya_stok', 'aruna L dusty pink ada?');
  assert.match(reply, /habis/i);
});

test('jawaban berubah ketika stok diubah admin', () => {
  catalog[0].variants[1].stock = 1;
  const { reply } = ask('tanya_stok', 'aruna M oatmeal ada?');
  assert.match(reply, /1 pcs/);
  catalog[0].variants[1].stock = 6;
});

test('tanya warna & bahan', () => {
  const { reply } = ask('tanya_warna_bahan', 'bahan aruna apa?');
  assert.match(reply, /Linen/);
  assert.match(reply, /Oatmeal/);
});

test('rekomendasi tanpa nama produk', () => {
  const { reply, products } = ask('rekomendasi', 'ada dress warna sage?');
  assert.equal(products[0].id, 3);
  assert.match(reply, /Kirana/);
});

test('warna yang tidak ada di katalog dijawab jujur', () => {
  const { reply } = ask('rekomendasi', 'ada dress warna merah?');
  assert.match(reply, /belum ada/);
});

test('pertanyaan di luar konteks ditolak sopan', () => {
  assert.equal(ask('di_luar_konteks', 'siapa presiden indonesia').reply, OUT_OF_CONTEXT_REPLY);
});

test('klasifikasi cadangan: 10 pertanyaan di luar konteks', () => {
  const offTopic = [
    'siapa presiden indonesia sekarang?', 'berapa hasil 25 dikali 4', 'cuaca jakarta hari ini gimana',
    'ajarin aku coding python dong', 'rekomendasi film horor terbaru', 'kapan piala dunia berikutnya',
    'resep nasi goreng enak', 'apa ibu kota jepang', 'tolong buatkan puisi cinta', 'harga bitcoin sekarang berapa',
  ];
  for (const q of offTopic) assert.equal(classifyByKeywords(q).intent, 'di_luar_konteks', q);
});

test('klasifikasi cadangan: pertanyaan toko', () => {
  assert.equal(classifyByKeywords('stok dress M masih ada?').intent, 'tanya_stok');
  assert.equal(classifyByKeywords('ukuran blouse apa aja?').intent, 'tanya_ukuran');
  assert.equal(classifyByKeywords('bahannya adem gak kak?').intent, 'tanya_warna_bahan');
  assert.equal(classifyByKeywords('halo kak').intent, 'sapaan');
});

test('guardrail LLM menolak jawaban yang mengubah angka', () => {
  const draft = 'Aruna Linen Dress ukuran M tersedia 6 pcs. Harganya Rp 489.000.';
  assert.equal(isFaithful(draft, 'Ada Kak, Aruna ukuran M tinggal 6 pcs, harga Rp 489.000.'), true);
  assert.equal(isFaithful(draft, 'Ada Kak, Aruna ukuran M tinggal 5 pcs, harga Rp 489.000.'), false);
});
