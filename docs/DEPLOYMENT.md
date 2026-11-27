# Panduan Deploy (Free Tier)

Rekomendasi kombinasi (semuanya punya paket gratis — **cek kuota terbaru di situs masing-masing sebelum memilih**, karena kebijakan free tier sering berubah):

| Bagian | Layanan | Catatan |
|---|---|---|
| Frontend (React/Vite) | **Vercel** atau Netlify | `vercel.json` / `public/_redirects` sudah disiapkan agar refresh di `/admin/produk` tidak 404 |
| Backend (Express) | **Render** (Web Service) | Free tier "tidur" setelah idle → request pertama lambat (Axios timeout sudah 30 detik) |
| Database MySQL | **Aiven for MySQL**, **TiDB Cloud Serverless** (kompatibel MySQL), atau Railway | Biasanya wajib SSL → `DB_SSL=true` |
| API model (FastAPI) | Render / Hugging Face Spaces | Dikerjakan bersama tim Gen AI |

## 1. Database
1. Buat database MySQL di provider pilihan, catat host, port, user, password, nama DB.
2. Dari komputer lokal, isi `backend/.env` dengan kredensial cloud tersebut lalu jalankan:
   ```bash
   npm run db:init:seed   # atau db:init lalu import:csv untuk data asli
   npm run seed:admin
   ```

## 2. Backend di Render
1. Push repo ke GitHub (private). Render → **New → Web Service** → pilih repo.
2. Root Directory: `backend` · Build: `npm install` · Start: `npm start`.
3. Environment variables: salin semua dari `.env.example` dan isi nilainya:
   * `NODE_ENV=production`
   * `CORS_ORIGIN=https://<domain-frontend>.vercel.app`
   * `DB_*`, `DB_SSL=true`
   * `JWT_SECRET` (string acak panjang)
   * `ML_API_URL=https://<url-ml-service>`
   * `GEMINI_API_KEY` (opsional)
4. Cek: `https://<backend>.onrender.com/api/v1/health` → `database: "ok"`.

## 3. Frontend di Vercel
1. Vercel → **Add New Project** → pilih repo → Root Directory `frontend` (Framework: Vite).
2. Environment variables: `VITE_API_BASE_URL=https://<backend>.onrender.com/api/v1`, `VITE_SHOPEE_URL`, `VITE_WHATSAPP_NUMBER`.
3. Deploy. Variabel `VITE_*` dibaca saat build → setelah mengubahnya, **redeploy**.

## 4. Checklist setelah deploy
- [ ] Buka website di ponsel melalui data seluler (bukan Wi-Fi yang sama).
- [ ] Login admin, ubah stok, lalu tanyakan stok yang sama di chatbot → jawaban berubah.
- [ ] Matikan sementara ML service (atau isi `ML_API_URL` salah) → chatbot tetap menjawab dengan label "mode cadangan".
- [ ] Tidak ada `.env`, password, atau API key di repository (`git log -p | grep -i key`).

## Masalah umum
| Gejala | Penyebab | Solusi |
|---|---|---|
| "Tidak dapat terhubung ke server" | `VITE_API_BASE_URL` salah / backend tidur | Cek URL, buka `/api/v1/health` dulu |
| Request diblokir CORS | `CORS_ORIGIN` tidak sama persis dengan domain frontend | Isi tanpa `/` di akhir, redeploy backend |
| `database: "down"` | Kredensial/SSL | Cek `DB_*`, set `DB_SSL=true` |
| Halaman admin 404 saat refresh | Rewrite SPA belum aktif | Pastikan `vercel.json` ikut ter-deploy |
