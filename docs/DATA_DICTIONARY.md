# Kamus Data (Data Dictionary) — Database Halika.Clo

## `products`
| Kolom | Tipe | Wajib | Keterangan | Validasi (Joi) |
|---|---|---|---|---|
| id | INT UNSIGNED | ya | ID otomatis | – |
| name | VARCHAR(120) | ya | Nama produk | 3–120 karakter, unik |
| slug | VARCHAR(140) | ya | Nama di URL, dibuat otomatis dari `name` | – |
| category | VARCHAR(50) | ya | Dress / Atasan / Bawahan / Set / Outer / Hijab / Lainnya | salah satu daftar |
| description | TEXT | tidak | Deskripsi produk | maks 2000 karakter |
| material | VARCHAR(100) | ya | Bahan (Linen, Katun, Rayon, ...) | 2–100 karakter |
| price | INT UNSIGNED | ya | Harga dalam Rupiah, tanpa titik | 1.000 – 50.000.000 |
| image_url | VARCHAR(500) | tidak | URL foto produk | URL http/https |
| is_active | TINYINT(1) | ya | 1 = tampil di katalog, 0 = disembunyikan | boolean |
| created_at / updated_at | TIMESTAMP | ya | Waktu dibuat / diubah | – |

## `product_variants` (stok terpusat)
| Kolom | Tipe | Wajib | Keterangan | Validasi |
|---|---|---|---|---|
| id | INT UNSIGNED | ya | ID varian | – |
| product_id | INT UNSIGNED | ya | FK ke `products.id` (hapus produk → varian ikut terhapus) | – |
| size | VARCHAR(10) | ya | XS, S, M, L, XL, XXL, All Size | salah satu daftar |
| color | VARCHAR(40) | ya | Nama warna, mis. "Dusty Pink" | 2–40 karakter |
| stock | INT UNSIGNED | ya | Jumlah stok fisik | bilangan bulat 0–9999 (**tidak boleh negatif**) |

Kombinasi `(product_id, size, color)` unik.

## `stock_logs`
Jejak setiap perubahan stok oleh admin: `variant_id`, `product_id`, `old_stock`, `new_stock`, `changed_by` (id admin), `note`, `created_at`. Dipakai saat uji selisih stok sistem vs stok fisik bersama Co-owner.

## `chat_logs` (riwayat inferensi Gen AI)
| Kolom | Tipe | Keterangan |
|---|---|---|
| session_id | VARCHAR(64) | ID sesi acak dari browser (tidak berisi identitas pelanggan) |
| message | TEXT | Pertanyaan pelanggan |
| intent | VARCHAR(40) | Hasil klasifikasi intent |
| confidence | DECIMAL(5,4) | Tingkat keyakinan model 0–1 |
| intent_source | ENUM | `model` = dari API Gen AI, `fallback` = klasifikasi cadangan saat API mati |
| product_id | INT | Produk yang dikenali (ekstraksi produk), boleh kosong |
| size / color | VARCHAR | Ukuran / warna yang dikenali |
| answer | TEXT | Jawaban yang dikirim |
| llm_used | TINYINT(1) | 1 jika bahasa jawaban dirapikan LLM |
| response_ms | INT | Waktu respons backend (ms) |
| created_at | TIMESTAMP | Waktu pertanyaan |

## `users`
Admin (owner/co-owner): `name`, `email` (unik), `password_hash` (bcrypt, **bukan** password asli), `role`.

## Definisi metrik dashboard
* **Stok menipis**: varian dengan `stock` ≤ `LOW_STOCK_THRESHOLD` (default 3) dan > 0.
* **Stok habis**: varian dengan `stock` = 0.
* **Produk paling sering ditanyakan**: jumlah baris `chat_logs` per `product_id` dalam N hari terakhir (default 30), intent selain `di_luar_konteks`.
