import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from '../config/db.js';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSIGHTS_FILE = path.join(__dirname, '..', 'data', 'insights.json');

/** Insight & rekomendasi hasil analisis tim Data Science (file JSON). */
async function readInsights() {
  try {
    return JSON.parse(await fs.readFile(INSIGHTS_FILE, 'utf8'));
  } catch {
    return null;
  }
}

export async function getSummary({ days }) {
  const threshold = env.lowStockThreshold;

  const [[stock]] = await pool.query(
    `SELECT COUNT(DISTINCT p.id) AS activeProducts,
            COALESCE(SUM(v.stock), 0) AS totalStock,
            COALESCE(SUM(v.stock = 0), 0) AS outOfStockVariants,
            COALESCE(SUM(v.stock > 0 AND v.stock <= ?), 0) AS lowStockVariants
     FROM products p LEFT JOIN product_variants v ON v.product_id = p.id
     WHERE p.is_active = 1`,
    [threshold],
  );

  const [lowStock] = await pool.query(
    `SELECT v.id AS variantId, p.id AS productId, p.name, p.slug, v.size, v.color, v.stock
     FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE p.is_active = 1 AND v.stock <= ?
     ORDER BY v.stock ASC, p.name ASC LIMIT 30`,
    [threshold],
  );

  // Produk paling sering ditanyakan + kondisi stoknya saat ini
  const [topAsked] = await pool.query(
    `SELECT p.id AS productId, p.name, p.slug, COUNT(c.id) AS askCount,
            (SELECT COALESCE(SUM(v.stock),0) FROM product_variants v WHERE v.product_id = p.id) AS totalStock,
            (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id AND v.stock <= ?) AS lowVariants
     FROM chat_logs c JOIN products p ON p.id = c.product_id
     WHERE c.created_at >= NOW() - INTERVAL ? DAY AND c.intent <> 'di_luar_konteks'
     GROUP BY p.id, p.name, p.slug
     ORDER BY askCount DESC LIMIT 8`,
    [threshold, days],
  );

  const [intents] = await pool.query(
    `SELECT intent, COUNT(*) AS count FROM chat_logs
     WHERE created_at >= NOW() - INTERVAL ? DAY GROUP BY intent ORDER BY count DESC`,
    [days],
  );

  const [[chat]] = await pool.query(
    `SELECT COUNT(*) AS totalChats,
            COALESCE(SUM(intent = 'di_luar_konteks'), 0) AS outOfContext,
            COALESCE(SUM(intent_source = 'fallback'), 0) AS fallbackCount,
            COALESCE(ROUND(AVG(response_ms)), 0) AS avgResponseMs
     FROM chat_logs WHERE created_at >= NOW() - INTERVAL ? DAY`,
    [days],
  );

  const [perDay] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS count FROM chat_logs
     WHERE created_at >= CURDATE() - INTERVAL 6 DAY GROUP BY day ORDER BY day`,
  );

  // Lengkapi 7 hari terakhir agar grafik tidak bolong
  const chatsPerDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { day: key, count: perDay.find((r) => r.day === key)?.count || 0 };
  });

  // Prioritas restock: sering ditanyakan DAN punya varian stok menipis/habis
  const restockPriority = topAsked
    .filter((p) => p.lowVariants > 0)
    .map((p) => ({ ...p, reason: `Ditanyakan ${p.askCount}x dalam ${days} hari, ${p.lowVariants} varian stok ≤ ${threshold}` }));

  return {
    periodDays: days,
    lowStockThreshold: threshold,
    stock: {
      activeProducts: Number(stock.activeProducts),
      totalStock: Number(stock.totalStock),
      outOfStockVariants: Number(stock.outOfStockVariants),
      lowStockVariants: Number(stock.lowStockVariants),
    },
    chat: {
      totalChats: Number(chat.totalChats),
      outOfContext: Number(chat.outOfContext),
      fallbackCount: Number(chat.fallbackCount),
      avgResponseMs: Number(chat.avgResponseMs),
    },
    lowStock,
    topAsked: topAsked.map((p) => ({ ...p, askCount: Number(p.askCount), totalStock: Number(p.totalStock), lowVariants: Number(p.lowVariants) })),
    restockPriority,
    intents: intents.map((i) => ({ intent: i.intent, count: Number(i.count) })),
    chatsPerDay,
    insights: await readInsights(),
  };
}
