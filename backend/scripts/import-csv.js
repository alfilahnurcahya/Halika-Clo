/**
 * Impor data bersih dari tim Data Science ke MySQL.
 *   npm run import:csv -- ../data/products_clean.csv ../data/variants_clean.csv
 *
 * products_clean.csv : name,category,material,price,description,image_url
 * variants_clean.csv : product_name,size,color,stock
 *
 * Data divalidasi dengan skema Joi yang sama dengan form admin.
 * Produk yang namanya sudah ada akan diperbarui (upsert berdasarkan slug).
 */
import fs from 'node:fs/promises';
import pool from '../src/config/db.js';
import { productSchema } from '../src/validators/schemas.js';
import { slugify } from '../src/utils/text.js';

/** Parser CSV sederhana yang mendukung tanda kutip ganda. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  const [header, ...data] = rows;
  const keys = header.map((h) => h.trim().toLowerCase());
  return data.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

const [productsFile, variantsFile] = process.argv.slice(2);
if (!productsFile || !variantsFile) {
  console.error('Pemakaian: npm run import:csv -- <products_clean.csv> <variants_clean.csv>');
  process.exit(1);
}

const products = parseCsv(await fs.readFile(productsFile, 'utf8'));
const variants = parseCsv(await fs.readFile(variantsFile, 'utf8'));

let ok = 0;
const failed = [];
const conn = await pool.getConnection();
try {
  for (const p of products) {
    const payload = {
      name: p.name,
      category: p.category,
      material: p.material,
      price: p.price,
      description: p.description || '',
      imageUrl: p.image_url || '',
      isActive: true,
      variants: variants
        .filter((v) => v.product_name.toLowerCase() === p.name.toLowerCase())
        .map((v) => ({ size: v.size, color: v.color, stock: v.stock })),
    };
    const { value, error } = productSchema.validate(payload, { abortEarly: false, convert: true });
    if (error) { failed.push({ name: p.name, reason: error.details.map((d) => d.message).join('; ') }); continue; }

    await conn.beginTransaction();
    try {
      await conn.query(
        `INSERT INTO products (name, slug, category, description, material, price, image_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE category=VALUES(category), description=VALUES(description), material=VALUES(material),
           price=VALUES(price), image_url=VALUES(image_url), id=LAST_INSERT_ID(id)`,
        [value.name, slugify(value.name), value.category, value.description, value.material, value.price, value.imageUrl || null],
      );
      const [[{ id }]] = await conn.query('SELECT LAST_INSERT_ID() AS id');
      for (const v of value.variants) {
        await conn.query(
          `INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE stock = VALUES(stock)`,
          [id, v.size, v.color, v.stock],
        );
      }
      await conn.commit();
      ok += 1;
    } catch (err) {
      await conn.rollback();
      failed.push({ name: p.name, reason: err.message });
    }
  }
} finally {
  conn.release();
  await pool.end();
}

console.log(`✔ ${ok} produk berhasil diimpor.`);
if (failed.length) {
  console.log(`✖ ${failed.length} produk gagal:`);
  failed.forEach((f) => console.log(`  - ${f.name}: ${f.reason}`));
}
