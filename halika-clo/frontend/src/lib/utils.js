import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatRupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'];
export const CATEGORIES = ['Dress', 'Atasan', 'Bawahan', 'Set', 'Outer', 'Hijab', 'Lainnya'];

export const INTENT_LABELS = {
  tanya_stok: 'Tanya stok',
  tanya_ukuran: 'Tanya ukuran',
  tanya_warna_bahan: 'Tanya warna/bahan',
  di_luar_konteks: 'Di luar konteks',
  sapaan: 'Sapaan',
  rekomendasi: 'Rekomendasi',
};

const SHOPEE_URL = import.meta.env.VITE_SHOPEE_URL || '';
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';

export const orderLinks = (product, { size, color } = {}) => {
  const detail = [product?.name, size && `ukuran ${size}`, color && `warna ${color}`].filter(Boolean).join(', ');
  const text = `Halo Halika.Clo, saya ingin memesan ${detail || 'produk'}. Apakah masih tersedia?`;
  return {
    shopee: SHOPEE_URL || null,
    whatsapp: WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}` : null,
  };
};
