import Joi from 'joi';

export const CATEGORIES = ['Dress', 'Atasan', 'Bawahan', 'Set', 'Outer', 'Hijab', 'Lainnya'];
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'];

// Pesan error dalam Bahasa Indonesia agar mudah dipahami owner
const messages = {
  'any.required': '{#label} wajib diisi.',
  'string.empty': '{#label} tidak boleh kosong.',
  'string.min': '{#label} minimal {#limit} karakter.',
  'string.max': '{#label} maksimal {#limit} karakter.',
  'string.email': '{#label} harus berupa email yang valid.',
  'string.uri': '{#label} harus berupa URL yang valid (diawali http/https).',
  'number.base': '{#label} harus berupa angka.',
  'number.integer': '{#label} harus bilangan bulat.',
  'number.min': '{#label} tidak boleh kurang dari {#limit}.',
  'number.max': '{#label} tidak boleh lebih dari {#limit}.',
  'any.only': '{#label} harus salah satu dari: {#valids}.',
  'array.min': '{#label} minimal berisi {#limit} data.',
  'array.unique': 'Kombinasi ukuran dan warna tidak boleh ganda.',
  'boolean.base': '{#label} harus true/false.',
};

const variantSchema = Joi.object({
  id: Joi.number().integer().positive().optional(),
  size: Joi.string().trim().valid(...SIZES).required().label('Ukuran'),
  color: Joi.string().trim().min(2).max(40).required().label('Warna'),
  stock: Joi.number().integer().min(0).max(9999).required().label('Stok'),
}).messages(messages);

export const productSchema = Joi.object({
  name: Joi.string().trim().min(3).max(120).required().label('Nama produk'),
  category: Joi.string().trim().valid(...CATEGORIES).required().label('Kategori'),
  description: Joi.string().trim().allow('').max(2000).default('').label('Deskripsi'),
  material: Joi.string().trim().min(2).max(100).required().label('Bahan'),
  price: Joi.number().integer().min(1000).max(50000000).required().label('Harga'),
  imageUrl: Joi.string().trim().uri({ scheme: ['http', 'https'] }).allow('', null).max(500).label('URL foto'),
  isActive: Joi.boolean().default(true).label('Status tampil'),
  variants: Joi.array()
    .items(variantSchema)
    .min(1)
    .unique((a, b) => a.size === b.size && a.color.toLowerCase() === b.color.toLowerCase())
    .required()
    .label('Varian stok'),
}).messages(messages);

export const stockSchema = Joi.object({
  stock: Joi.number().integer().min(0).max(9999).required().label('Stok'),
}).messages(messages);

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  variantId: Joi.number().integer().positive(),
}).messages(messages);

export const productQuerySchema = Joi.object({
  search: Joi.string().trim().allow('').max(100).default(''),
  category: Joi.string().trim().allow('').max(50).default(''),
  size: Joi.string().trim().allow('').max(10).default(''),
  color: Joi.string().trim().allow('').max(40).default(''),
  inStock: Joi.boolean().default(false),
  sort: Joi.string().valid('newest', 'price_asc', 'price_desc', 'name').default('newest'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(12),
}).messages(messages);

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().label('Email'),
  password: Joi.string().min(6).max(100).required().label('Password'),
}).messages(messages);

export const chatSchema = Joi.object({
  message: Joi.string().trim().min(2).max(500).required().label('Pesan'),
  sessionId: Joi.string().trim().alphanum().min(6).max(64).required().label('Session ID'),
}).messages(messages);

export const chatLogQuerySchema = Joi.object({
  intent: Joi.string().trim().allow('').max(40).default(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).messages(messages);

export const analyticsQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
}).messages(messages);
