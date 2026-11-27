# Kontrak API Halika.Clo

> Disepakati di Minggu 1 oleh tim Full-Stack, Gen AI, dan Data Science (Side Quest: "Menyepakati kontrak API atau format data sebelum pengembangan").
> Ubah dokumen ini lebih dulu **sebelum** mengubah kode jika ada perubahan kontrak.

## 1. Arsitektur singkat

```
Browser (React, Vite)  --Axios-->  Backend Express (/api/v1)  --HTTP-->  API Model Gen AI (FastAPI/Flask)
                                         |                    \--HTTP-->  LLM API proprietary (opsional)
                                         v
                                       MySQL
```

* Frontend **tidak pernah** memanggil API model atau LLM secara langsung. URL & API key hanya ada di `.env` backend.
* Format respons backend selalu:

```json
{ "status": "success", "message": "...", "data": { } }
{ "status": "fail",    "message": "Pesan yang bisa dibaca pengguna", "errors": [ { "field": "price", "message": "..." } ] }
```

| Kode | Arti |
|------|------|
| 200 / 201 | Berhasil |
| 400 | Input tidak valid (validasi Joi) |
| 401 | Belum login / token tidak valid |
| 404 | Data tidak ditemukan |
| 409 | Data bentrok (mis. nama produk sudah ada) |
| 429 | Terlalu banyak permintaan |
| 500 | Kesalahan server |

---

## 2. Kontrak Backend ↔ API Model (tanggung jawab Gen AI)

### `POST {ML_API_URL}/predict-intent`

Request:
```json
{ "text": "aruna linen dress ukuran M masih ada?" }
```

Response 200:
```json
{ "intent": "tanya_stok", "confidence": 0.91 }
```

Field opsional yang boleh ditambahkan tim Gen AI (backend akan memakainya bila ada):
```json
{ "intent": "tanya_stok", "confidence": 0.91, "entities": { "size": "M", "color": null } }
```

Label intent (minimal 4, wajib persis seperti ini — huruf kecil, snake_case):

| Intent | Contoh pertanyaan |
|---|---|
| `tanya_stok` | "Aruna dress M masih ready?" |
| `tanya_ukuran` | "Senja blouse ada size XL?" |
| `tanya_warna_bahan` | "Kirana floral bahannya apa?", "Warna apa aja?" |
| `di_luar_konteks` | "Siapa presiden Indonesia?" |
| `sapaan` *(opsional)* | "Halo kak" |
| `rekomendasi` *(opsional)* | "Ada dress warna sage?" |

Error:
* `422` jika `text` kosong → backend sudah memvalidasi lebih dulu, jadi seharusnya tidak terjadi.
* Timeout backend: `ML_API_TIMEOUT_MS` (default 5000 ms). Jika timeout/error, backend memakai **klasifikasi cadangan berbasis kata kunci** dan mencatat `intent_source = "fallback"`.

Untuk pengembangan sebelum model siap, jalankan mock: `node tools/mock-ml-api.js` (port 8000).

---

## 3. Endpoint Backend (dipakai Frontend)

Base URL: `{VITE_API_BASE_URL}` = `https://<backend>/api/v1`

### Publik
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/health` | Cek server & database |
| GET | `/products` | Katalog. Query: `search`, `category`, `size`, `color`, `inStock=true`, `sort=newest\|price_asc\|price_desc\|name`, `page`, `limit` |
| GET | `/products/filters` | Daftar kategori, ukuran, warna untuk filter |
| GET | `/products/:slug` | Detail produk + varian stok |
| POST | `/chat` | Kirim pertanyaan ke chatbot |

`POST /chat` request:
```json
{ "message": "aruna linen dress M masih ada?", "sessionId": "c1a2b3..." }
```
Response:
```json
{
  "status": "success",
  "data": {
    "reply": "Aruna Linen Dress ukuran M masih tersedia: Oatmeal 6 pcs, Dusty Pink 3 pcs.",
    "intent": "tanya_stok",
    "confidence": 0.91,
    "intentSource": "model",
    "llmUsed": false,
    "products": [ { "id": 1, "name": "Aruna Linen Dress", "slug": "aruna-linen-dress", "price": 489000, "imageUrl": "...", "totalStock": 15 } ]
  }
}
```

### Admin (header `Authorization: Bearer <token>`)
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | Profil admin yang login |
| GET | `/admin/products` | Semua produk (termasuk nonaktif) |
| POST | `/products` | Tambah produk + varian |
| PUT | `/products/:id` | Ubah produk + varian |
| DELETE | `/products/:id` | Hapus produk |
| PATCH | `/products/:id/variants/:variantId/stock` | `{ stock }` ubah stok cepat |
| GET | `/chat/logs` | Riwayat chat. Query: `intent`, `page`, `limit` |
| GET | `/analytics/summary` | Ringkasan dashboard restock |

Body `POST/PUT /products`:
```json
{
  "name": "Aruna Linen Dress",
  "category": "Dress",
  "description": "Dress linen ...",
  "material": "Linen",
  "price": 489000,
  "imageUrl": "https://...",
  "isActive": true,
  "variants": [ { "size": "M", "color": "Oatmeal", "stock": 6 } ]
}
```

---

## 4. Kontrak data dari tim Data Science

1. **Data produk bersih** → format CSV `products_clean.csv` (`name, category, material, price, description`) dan `variants_clean.csv` (`product_name, size, color, stock`). Diimpor ke MySQL oleh Full-Stack (lihat `backend/scripts/import-csv.js`).
2. **Dataset intent** → `intent_dataset.csv` dengan kolom `text, intent, source` (`source` = `real` / `dummy`). Dipakai tim Gen AI.
3. **Insight & rekomendasi untuk dashboard** → `backend/src/data/insights.json`:

```json
{
  "generatedAt": "2026-12-05",
  "dataSource": "Pembukuan Halika.Clo Okt–Nov 2026 (sudah dibersihkan) + riwayat chat",
  "insights": [
    { "title": "Dress paling sering ditanyakan", "detail": "...", "recommendation": "..." }
  ]
}
```
