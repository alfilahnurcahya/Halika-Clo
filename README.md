# Halika.Clo — Platform E-Commerce dengan Chatbot dan Dashboard Restock

> Capstone Project Asah 2026 led by Dicoding supported by GoTo · Tim **A26-CS057** · UMKM: **Halika.Clo** (fashion wanita)

Website responsif untuk Halika.Clo yang menyatukan **katalog produk dengan stok terpusat**, **halaman admin** untuk owner/co-owner, **chatbot Halika Assistant** yang menjawab pertanyaan stok/ukuran/warna/bahan dari data stok asli, dan **dashboard restock** (produk paling sering ditanyakan & stok menipis).

Hasil capstone adalah **prototype (MVP)** untuk demonstrasi dan validasi, belum untuk operasional penuh.

| | |
|---|---|
| 🌐 Website | `https://<isi-url-frontend>` |
| 🔌 API backend | `https://<isi-url-backend>/api/v1/health` |
| 🤖 API model intent | `https://<isi-url-ml>/docs` |
| 📦 File model (Google Drive) | `<isi-tautan-drive>` (akses lihat & unduh untuk capstone@student.devacademy.id) |

---

## 1. Masalah & peran solusi

* Stok dicatat manual di Google Sheets dan Excel yang sulit disamakan → **stok terpusat** di MySQL, dikelola dari halaman admin.
* Pertanyaan pelanggan (ukuran, warna, bahan, ketersediaan) dibalas manual oleh owner, sering terlambat saat live TikTok → **chatbot** menjawab otomatis dari data stok terbaru dan menolak pertanyaan di luar konteks toko.
* Owner sulit melihat produk mana yang perlu di-restock → **dashboard** menggabungkan riwayat pertanyaan chatbot dengan data stok.

## 2. Arsitektur (decoupled)

```
┌────────────────────┐   Axios (REST)   ┌──────────────────────┐   HTTP   ┌──────────────────────────┐
│ frontend/          │ ───────────────▶ │ backend/             │ ───────▶ │ ml-service/ (Gen AI)     │
│ React + Vite       │                  │ Express /api/v1      │          │ FastAPI + scikit-learn   │
│ Tailwind + shadcn  │ ◀─────────────── │ Joi · JWT · mysql2   │ ───────▶ │ LLM API (Gemini, opsional)│
└────────────────────┘                  └──────────┬───────────┘          └──────────────────────────┘
                                                   ▼
                                             MySQL (produk, varian stok, riwayat chat, log stok)
```

Frontend **tidak pernah** memanggil API model/LLM secara langsung; URL dan API key hanya ada di `.env` backend.

### Alur chatbot
1. Frontend mengirim `POST /api/v1/chat`.
2. Backend memvalidasi pesan (Joi), mengambil katalog & stok terbaru dari MySQL.
3. **Ekstraksi produk/ukuran/warna** dicocokkan dengan nama produk & warna di database (toleran salah ketik 1 huruf).
4. **Klasifikasi intent** oleh model tim Gen AI (`POST {ML_API_URL}/predict-intent`). Jika layanan mati/timeout → klasifikasi cadangan berbasis kata kunci (`intent_source = fallback`) sehingga website tetap bisa dipakai.
5. Jawaban disusun dari **data database** (template). Jika `GEMINI_API_KEY` diisi, LLM hanya **merapikan bahasa**; ada guardrail: semua angka stok/harga harus tetap sama, jika tidak → kembali ke template. Kuota habis/error → template.
6. Riwayat (pertanyaan, intent, confidence, produk, jawaban, waktu respons) disimpan ke `chat_logs`.

## 3. Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React 19, Vite (module bundler), **Tailwind CSS v4**, **shadcn/ui + Radix UI**, React Router, **Axios**, Sonner (notifikasi) |
| Backend | Node.js 20+, **Express 5** (RESTful `/api/v1/...`), **Joi** (schema validation), JWT + bcrypt (login admin), mysql2, Helmet, CORS, express-rate-limit |
| Database | MySQL 8 |
| Model intent | Python, scikit-learn, FastAPI (tim Gen AI) |
| Generatif | Gemini API (opsional, pelengkap) |

### Checklist yang dipenuhi
**Main Quest Full-Stack:** satu masalah UMKM jelas · ≥2 fitur utama (katalog stok terpusat + admin, chatbot, dashboard) · respons sesuai input (pencarian/filter, jawaban chatbot) · umpan balik setiap aksi (skeleton/spinner, toast berhasil/gagal, pesan error per field) · panduan owner (`/admin/panduan` + `docs/PANDUAN_OWNER.md`) · bisa dibuka di browser & ponsel.

**Side Quest Full-Stack:** arsitektur decoupled via Axios · Vite · Tailwind + shadcn/Radix · RESTful Express `/api/v1/resource` · penyimpanan persisten MySQL · riwayat inferensi Gen AI disimpan · backend sebagai penghubung layanan Gen AI · hasil Data Science di dashboard · Joi · penanganan kegagalan (server mati, koneksi putus, API model/LLM mati) · mockup (Figma Make) · responsif · kontrak API (`docs/API_CONTRACT.md`) · deploy free tier (`docs/DEPLOYMENT.md`).

### Keputusan desain UI
Diturunkan dari mockup tim di Figma Make: palet **ivory–cream–cokelat–rose** mencerminkan butik busana perempuan yang hangat dan elegan (bukan template e-commerce generik); **Playfair Display** untuk judul (kesan butik) dan **DM Sans** untuk teks (terbaca jelas di ponsel). Di ponsel tersedia navigasi bawah dengan tombol "Tanya Halika" agar chatbot mudah dijangkau ibu jari. Halaman keranjang/checkout/akun pada mockup **tidak dibangun** karena checkout & pembayaran di luar scope; pemesanan diarahkan ke Shopee/WhatsApp.

## 4. Struktur repository

```
halika-clo/
├── frontend/            React + Vite + Tailwind + shadcn/ui
│   └── src/
│       ├── components/ui/      komponen shadcn (Radix UI)
│       ├── components/…        layout, chat, admin, shop
│       ├── pages/              Home, Catalog, ProductDetail, admin/*
│       ├── lib/api.js          instance Axios + wrapper endpoint
│       └── context/            AuthContext (login admin)
├── backend/             Express REST API
│   ├── src/{config,controllers,middlewares,routes,services,validators,data}
│   ├── scripts/         init-db, seed-admin, import-csv
│   └── tests/           unit test logika chatbot (node:test)
├── ml-service/          kerangka FastAPI untuk tim Gen AI
├── database/            schema.sql, seed.sql (data dummy berlabel)
├── tools/mock-ml-api.js mock API model untuk pengembangan
└── docs/                kontrak API, kamus data, deployment, panduan owner, pengujian
```

## 5. Setup environment (lokal)

Prasyarat: **Node.js 20+**, **MySQL 8**, (opsional) Python 3.10+ untuk ml-service.

```bash
# 1) Backend
cd backend
cp .env.example .env          # isi DB_*, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run db:init:seed          # buat tabel + data contoh (PERINGATAN: menghapus tabel lama)
npm run seed:admin            # buat akun owner dari .env
npm run dev                   # http://localhost:5000/api/v1/health

# 2) Mock API model (selama model Gen AI belum siap) — terminal baru, dari root repo
node tools/mock-ml-api.js     # http://localhost:8000/predict-intent

# 3) Frontend — terminal baru
cd frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:5000/api/v1
npm install
npm run dev                   # http://localhost:5173
```

Halaman admin: `http://localhost:5173/admin` (login dengan ADMIN_EMAIL/ADMIN_PASSWORD).

### Model ML
Unduh model dari tautan Google Drive di atas, simpan ke `ml-service/model/intent_pipeline.joblib`, lalu:
```bash
cd ml-service && pip install -r requirements.txt && uvicorn app:app --port 8000
```
Ubah `ML_API_URL` di `backend/.env` ke URL layanan tersebut.

### Impor data dari tim Data Science
```bash
cd backend
npm run import:csv -- ../data/products_clean.csv ../data/variants_clean.csv
```

## 6. Pengujian

```bash
cd backend && npm test        # 14 unit test: ekstraksi produk, jawaban dari data, 10 pertanyaan di luar konteks, guardrail LLM
```
Skenario uji manual lengkap ada di `docs/TESTING.md`.

## 7. Sumber data & aset
* Data produk di `database/seed.sql` adalah **data contoh (dummy) buatan tim**, bukan data operasional Halika.Clo. Data asli berasal dari pembukuan owner (dengan izin) yang dibersihkan tim Data Science.
* Foto placeholder dari [Unsplash](https://unsplash.com) (Unsplash License) mengikuti mockup; diganti foto Halika.Clo yang telah diizinkan owner.

## 8. Tim
| Nama | Learning path | Tanggung jawab |
|---|---|---|
| Zelta Mylya Suwondo | AI Full-Stack | Katalog & detail, umpan balik & panduan, dashboard, mockup |
| Alfilah Nurcahya | AI Full-Stack | Admin & auth, REST API, integrasi model, deploy |
| Mochammad Gheron Shaquille | Next-Gen AI | Model intent, README Gen AI |
| Angelia Salsabila | Next-Gen AI | Chatbot, fitur generatif |
| Nita Rahmawati | Data Science | Pengolahan data, analisis |
| Daffa Taufiqulhafizh | Data Science | Dataset intent, kamus data |
