import pool from '../config/db.js';
import { AppError } from '../utils/response.js';
import { slugify } from '../utils/text.js';

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id DESC',
  name: 'p.name ASC',
};

const mapVariant = (v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock });

const mapProduct = (p, variants = []) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  category: p.category,
  description: p.description || '',
  material: p.material,
  price: p.price,
  imageUrl: p.image_url,
  isActive: Boolean(p.is_active),
  createdAt: p.created_at,
  updatedAt: p.updated_at,
  variants: variants.map(mapVariant),
  totalStock: variants.reduce((sum, v) => sum + v.stock, 0),
});

// Urutan ukuran agar tampil XS, S, M, ... bukan alfabetis
const SIZE_ORDER = "FIELD(size,'XS','S','M','L','XL','XXL','All Size')";

async function attachVariants(rows, conn = pool) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [variants] = await conn.query(
    `SELECT id, product_id, size, color, stock FROM product_variants
     WHERE product_id IN (?) ORDER BY ${SIZE_ORDER}, color`,
    [ids],
  );
  return rows.map((p) => mapProduct(p, variants.filter((v) => v.product_id === p.id)));
}

export async function listProducts(query, { includeInactive = false } = {}) {
  const where = [];
  const params = [];

  if (!includeInactive) where.push('p.is_active = 1');

  if (query.search) {
    where.push('(p.name LIKE ? OR p.material LIKE ? OR p.category LIKE ? OR p.description LIKE ?)');
    const like = `%${query.search}%`;
    params.push(like, like, like, like);
  }
  if (query.category) {
    where.push('p.category = ?');
    params.push(query.category);
  }
  if (query.size || query.color || query.inStock) {
    const sub = ['v.product_id = p.id'];
    if (query.size) { sub.push('v.size = ?'); params.push(query.size); }
    if (query.color) { sub.push('v.color = ?'); params.push(query.color); }
    if (query.inStock) sub.push('v.stock > 0');
    where.push(`EXISTS (SELECT 1 FROM product_variants v WHERE ${sub.join(' AND ')})`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const page = query.page || 1;
  const limit = query.limit || 12;

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT p.* FROM products p ${whereSql} ORDER BY ${SORTS[query.sort] || SORTS.newest} LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit],
  );

  return {
    products: await attachVariants(rows),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getFilters() {
  const [categories] = await pool.query(
    'SELECT category, COUNT(*) AS count FROM products WHERE is_active = 1 GROUP BY category ORDER BY category',
  );
  const [sizes] = await pool.query(
    `SELECT DISTINCT v.size FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE p.is_active = 1 ORDER BY FIELD(v.size,'XS','S','M','L','XL','XXL','All Size')`,
  );
  const [colors] = await pool.query(
    `SELECT DISTINCT v.color FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE p.is_active = 1 ORDER BY v.color`,
  );
  return {
    categories: categories.map((c) => ({ name: c.category, count: c.count })),
    sizes: sizes.map((s) => s.size),
    colors: colors.map((c) => c.color),
  };
}

export async function getProductBySlug(slug) {
  const [rows] = await pool.query('SELECT * FROM products WHERE slug = ? AND is_active = 1', [slug]);
  if (rows.length === 0) throw new AppError(404, 'Produk tidak ditemukan.');
  const [product] = await attachVariants(rows);
  return product;
}

export async function getProductById(id, conn = pool) {
  const [rows] = await conn.query('SELECT * FROM products WHERE id = ?', [id]);
  if (rows.length === 0) throw new AppError(404, 'Produk tidak ditemukan.');
  const [product] = await attachVariants(rows, conn);
  return product;
}

/** Semua produk aktif + varian, dipakai chatbot (selalu data stok terbaru). */
export async function getCatalogSnapshot() {
  const [rows] = await pool.query('SELECT * FROM products WHERE is_active = 1 ORDER BY id');
  return attachVariants(rows);
}

async function logStock(conn, { variantId, productId, oldStock, newStock, userId, note }) {
  await conn.query(
    'INSERT INTO stock_logs (variant_id, product_id, old_stock, new_stock, changed_by, note) VALUES (?, ?, ?, ?, ?, ?)',
    [variantId, productId, oldStock, newStock, userId || null, note],
  );
}

async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function createProduct(data, userId) {
  return withTransaction(async (conn) => {
    const [result] = await conn.query(
      `INSERT INTO products (name, slug, category, description, material, price, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, slugify(data.name), data.category, data.description, data.material, data.price, data.imageUrl || null, data.isActive],
    );
    const productId = result.insertId;

    for (const v of data.variants) {
      const [vr] = await conn.query(
        'INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)',
        [productId, v.size, v.color, v.stock],
      );
      await logStock(conn, { variantId: vr.insertId, productId, oldStock: null, newStock: v.stock, userId, note: 'Produk baru' });
    }
    return getProductById(productId, conn);
  });
}

export async function updateProduct(id, data, userId) {
  return withTransaction(async (conn) => {
    const [found] = await conn.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [id]);
    if (found.length === 0) throw new AppError(404, 'Produk tidak ditemukan.');

    await conn.query(
      `UPDATE products SET name = ?, slug = ?, category = ?, description = ?, material = ?, price = ?, image_url = ?, is_active = ?
       WHERE id = ?`,
      [data.name, slugify(data.name), data.category, data.description, data.material, data.price, data.imageUrl || null, data.isActive, id],
    );

    // Sinkronkan varian berdasarkan kombinasi ukuran + warna
    const [existing] = await conn.query('SELECT id, size, color, stock FROM product_variants WHERE product_id = ?', [id]);
    const key = (v) => `${v.size}|${v.color.trim().toLowerCase()}`;
    const existingMap = new Map(existing.map((v) => [key(v), v]));
    const incomingKeys = new Set();

    for (const v of data.variants) {
      const k = key(v);
      incomingKeys.add(k);
      const old = existingMap.get(k);
      if (old) {
        if (old.stock !== v.stock || old.color !== v.color) {
          await conn.query('UPDATE product_variants SET stock = ?, color = ? WHERE id = ?', [v.stock, v.color, old.id]);
          if (old.stock !== v.stock) {
            await logStock(conn, { variantId: old.id, productId: id, oldStock: old.stock, newStock: v.stock, userId, note: 'Ubah produk' });
          }
        }
      } else {
        const [vr] = await conn.query(
          'INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)',
          [id, v.size, v.color, v.stock],
        );
        await logStock(conn, { variantId: vr.insertId, productId: id, oldStock: null, newStock: v.stock, userId, note: 'Varian baru' });
      }
    }

    const removed = existing.filter((v) => !incomingKeys.has(key(v)));
    for (const v of removed) {
      await logStock(conn, { variantId: null, productId: id, oldStock: v.stock, newStock: 0, userId, note: `Varian ${v.size}/${v.color} dihapus` });
      await conn.query('DELETE FROM product_variants WHERE id = ?', [v.id]);
    }

    return getProductById(id, conn);
  });
}

export async function deleteProduct(id) {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw new AppError(404, 'Produk tidak ditemukan.');
}

export async function updateVariantStock(productId, variantId, stock, userId) {
  return withTransaction(async (conn) => {
    const [rows] = await conn.query(
      'SELECT id, stock FROM product_variants WHERE id = ? AND product_id = ? FOR UPDATE',
      [variantId, productId],
    );
    if (rows.length === 0) throw new AppError(404, 'Varian produk tidak ditemukan.');
    await conn.query('UPDATE product_variants SET stock = ? WHERE id = ?', [stock, variantId]);
    await logStock(conn, { variantId, productId, oldStock: rows[0].stock, newStock: stock, userId, note: 'Ubah stok cepat' });
    return getProductById(productId, conn);
  });
}
