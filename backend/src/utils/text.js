/** Huruf kecil, buang tanda baca, rapikan spasi. */
export const normalize = (text = '') =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const slugify = (text = '') => normalize(text).replace(/\s/g, '-').slice(0, 140);

export const formatRupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
