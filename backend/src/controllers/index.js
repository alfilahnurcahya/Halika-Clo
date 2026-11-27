import pool from '../config/db.js';
import { sendSuccess } from '../utils/response.js';
import * as products from '../services/product.service.js';
import * as auth from '../services/auth.service.js';
import * as chat from '../services/chat/chat.service.js';
import * as analytics from '../services/analytics.service.js';
import { isLlmEnabled } from '../services/chat/llmRephraser.js';
import env from '../config/env.js';

// ---------- Health ----------
export const health = async (_req, res) => {
  let database = 'ok';
  try { await pool.query('SELECT 1'); } catch { database = 'down'; }
  sendSuccess(res, {
    message: 'Halika.Clo API berjalan',
    data: { database, mlServiceConfigured: Boolean(env.ml.url), llmEnabled: isLlmEnabled(), time: new Date().toISOString() },
  });
};

// ---------- Auth ----------
export const login = async (req, res) => {
  const data = await auth.login(req.validated.body);
  sendSuccess(res, { message: 'Login berhasil', data });
};

export const me = async (req, res) => {
  sendSuccess(res, { data: await auth.getMe(req.user.id) });
};

// ---------- Products ----------
export const listProducts = async (req, res) => {
  const { products: list, meta } = await products.listProducts(req.validated.query);
  sendSuccess(res, { data: list, meta });
};

export const listAdminProducts = async (req, res) => {
  const { products: list, meta } = await products.listProducts(req.validated.query, { includeInactive: true });
  sendSuccess(res, { data: list, meta });
};

export const getFilters = async (_req, res) => {
  sendSuccess(res, { data: await products.getFilters() });
};

export const getProduct = async (req, res) => {
  sendSuccess(res, { data: await products.getProductBySlug(req.params.slug) });
};

export const createProduct = async (req, res) => {
  const data = await products.createProduct(req.validated.body, req.user.id);
  sendSuccess(res, { statusCode: 201, message: 'Produk berhasil ditambahkan', data });
};

export const updateProduct = async (req, res) => {
  const data = await products.updateProduct(req.validated.params.id, req.validated.body, req.user.id);
  sendSuccess(res, { message: 'Produk berhasil diperbarui', data });
};

export const deleteProduct = async (req, res) => {
  await products.deleteProduct(req.validated.params.id);
  sendSuccess(res, { message: 'Produk berhasil dihapus' });
};

export const updateStock = async (req, res) => {
  const { id, variantId } = req.validated.params;
  const data = await products.updateVariantStock(id, variantId, req.validated.body.stock, req.user.id);
  sendSuccess(res, { message: 'Stok berhasil diperbarui', data });
};

// ---------- Chat ----------
export const sendChat = async (req, res) => {
  sendSuccess(res, { data: await chat.handleChat(req.validated.body) });
};

export const listChatLogs = async (req, res) => {
  const { logs, meta } = await chat.listChatLogs(req.validated.query);
  sendSuccess(res, { data: logs, meta });
};

// ---------- Analytics ----------
export const analyticsSummary = async (req, res) => {
  sendSuccess(res, { data: await analytics.getSummary(req.validated.query) });
};
