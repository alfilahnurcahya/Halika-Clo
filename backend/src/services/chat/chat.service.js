import pool from '../../config/db.js';
import env from '../../config/env.js';
import { getCatalogSnapshot } from '../product.service.js';
import { predictIntent } from './intentClient.js';
import { classifyByKeywords } from './fallbackIntent.js';
import { extractEntities } from './entityExtractor.js';
import { composeAnswer } from './answerComposer.js';
import { rephrase } from './llmRephraser.js';

async function saveLog(entry) {
  try {
    await pool.query(
      `INSERT INTO chat_logs (session_id, message, intent, confidence, intent_source, product_id, size, color, answer, llm_used, response_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.sessionId, entry.message, entry.intent, entry.confidence, entry.intentSource,
        entry.productId, entry.size, entry.color, entry.answer, entry.llmUsed ? 1 : 0, entry.responseMs,
      ],
    );
  } catch (err) {
    // Gagal menyimpan riwayat tidak boleh membuat chatbot ikut gagal
    console.error('[chat] Gagal menyimpan riwayat:', err.message);
  }
}

export async function handleChat({ message, sessionId }) {
  const startedAt = Date.now();

  // 1. Data katalog & stok terbaru dari database
  const catalog = await getCatalogSnapshot();

  // 2. Ekstraksi produk / ukuran / warna dari pertanyaan
  const entities = extractEntities(message, catalog);

  // 3. Klasifikasi intent oleh model tim Gen AI, fallback jika layanan mati
  let prediction = await predictIntent(message);
  let intentSource = 'model';
  if (!prediction) {
    prediction = classifyByKeywords(message, { productMentioned: Boolean(entities.product || entities.candidates.length) });
    intentSource = 'fallback';
  }

  // Entitas dari model (jika disediakan) melengkapi hasil ekstraksi backend
  if (prediction.entities) {
    entities.size = entities.size || prediction.entities.size || null;
    entities.color = entities.color || prediction.entities.color || null;
  }

  // Aturan pengaman: produk dari katalog jelas disebut -> bukan di luar konteks
  if (prediction.intent === 'di_luar_konteks' && entities.product) {
    prediction = { ...prediction, intent: 'tanya_stok' };
  }

  const lowConfidence = intentSource === 'model' && prediction.confidence < env.ml.minConfidence;

  // 4. Jawaban dari data asli (template)
  const { reply: draft, products } = composeAnswer({ intent: prediction.intent, lowConfidence, entities, catalog });

  // 5. Rapikan bahasa dengan LLM (opsional, ada guardrail & fallback)
  let reply = draft;
  let llmUsed = false;
  if (prediction.intent !== 'di_luar_konteks' && !lowConfidence) {
    const polished = await rephrase(message, draft);
    if (polished) { reply = polished; llmUsed = true; }
  }

  const responseMs = Date.now() - startedAt;

  // 6. Simpan riwayat inferensi
  await saveLog({
    sessionId,
    message,
    intent: prediction.intent,
    confidence: prediction.confidence,
    intentSource,
    productId: entities.product?.id || null,
    size: entities.size,
    color: entities.color,
    answer: reply,
    llmUsed,
    responseMs,
  });

  return {
    reply,
    intent: prediction.intent,
    confidence: prediction.confidence,
    intentSource,
    llmUsed,
    products,
    responseMs,
  };
}

export async function listChatLogs({ intent, page, limit }) {
  const where = intent ? 'WHERE c.intent = ?' : '';
  const params = intent ? [intent] : [];
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM chat_logs c ${where}`, params);
  const [rows] = await pool.query(
    `SELECT c.id, c.session_id, c.message, c.intent, c.confidence, c.intent_source, c.size, c.color, c.answer,
            c.llm_used, c.response_ms, c.created_at, p.name AS product_name
     FROM chat_logs c LEFT JOIN products p ON p.id = c.product_id
     ${where} ORDER BY c.created_at DESC, c.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit],
  );
  return {
    logs: rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      message: r.message,
      intent: r.intent,
      confidence: r.confidence,
      intentSource: r.intent_source,
      productName: r.product_name,
      size: r.size,
      color: r.color,
      answer: r.answer,
      llmUsed: Boolean(r.llm_used),
      responseMs: r.response_ms,
      createdAt: r.created_at,
    })),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}
