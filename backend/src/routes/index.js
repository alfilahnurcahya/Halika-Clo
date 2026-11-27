import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as c from '../controllers/index.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  analyticsQuerySchema, chatLogQuerySchema, chatSchema, idParamSchema,
  loginSchema, productQuerySchema, productSchema, stockSchema,
} from '../validators/schemas.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { status: 'fail', message: 'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  message: { status: 'fail', message: 'Terlalu banyak pesan. Tunggu sebentar lalu coba lagi ya, Kak.' },
});

router.get('/health', c.health);

// Auth admin
router.post('/auth/login', loginLimiter, validate(loginSchema), c.login);
router.get('/auth/me', requireAuth, c.me);

// Produk (publik)
router.get('/products', validate(productQuerySchema, 'query'), c.listProducts);
router.get('/products/filters', c.getFilters);
router.get('/products/:slug', c.getProduct);

// Produk (admin)
router.get('/admin/products', requireAuth, validate(productQuerySchema, 'query'), c.listAdminProducts);
router.post('/products', requireAuth, validate(productSchema), c.createProduct);
router.put('/products/:id', requireAuth, validate(idParamSchema, 'params'), validate(productSchema), c.updateProduct);
router.delete('/products/:id', requireAuth, validate(idParamSchema, 'params'), c.deleteProduct);
router.patch(
  '/products/:id/variants/:variantId/stock',
  requireAuth, validate(idParamSchema, 'params'), validate(stockSchema), c.updateStock,
);

// Chatbot
router.post('/chat', chatLimiter, validate(chatSchema), c.sendChat);
router.get('/chat/logs', requireAuth, validate(chatLogQuerySchema, 'query'), c.listChatLogs);

// Dashboard
router.get('/analytics/summary', requireAuth, validate(analyticsQuerySchema, 'query'), c.analyticsSummary);

export default router;
