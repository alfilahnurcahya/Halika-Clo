# Rencana Kerja Full-Stack (Zelta & Alfilah) — 20 Nov s.d. 20 Des 2026

Mengikuti jadwal di Project Plan. ✅ = sudah tersedia di kerangka repository ini, tinggal dipelajari, disesuaikan, dan diuji.

## Cara kerja Git (wajib — Side Quest "dokumentasikan perubahan dengan Git")
1. Buat repo **private** di GitHub, undang semua anggota. Branch `main` = versi stabil yang di-deploy.
2. Setiap fitur di branch sendiri: `feat/katalog-filter`, `fix/validasi-stok`, dst.
3. Commit kecil & jelas: `feat(admin): tambah dialog ubah stok cepat`.
4. Pull Request → di-review anggota lain → merge ke `main`.

## Minggu 1 (20–26 Nov) — fondasi
- [ ] Rapat kontrak API dengan Gen AI & Data Science, sepakati `docs/API_CONTRACT.md` ✅ (draf)
- [ ] Skema database `database/schema.sql` ✅ + kamus data ✅
- [ ] Setup repo, frontend (Vite + Tailwind + shadcn) ✅, backend Express ✅, login admin ✅
- [ ] Pilih hosting (lihat `docs/DEPLOYMENT.md`) & deploy kerangka awal
- [ ] Jalankan `tools/mock-ml-api.js` agar chatbot bisa dikembangkan sebelum model siap

## Minggu 2 (27 Nov–3 Des) — fitur inti
- [ ] **Alfilah**: CRUD produk & stok + validasi Joi ✅ → uji semua kasus input salah; impor data bersih dari tim DS (`npm run import:csv`)
- [ ] **Zelta**: katalog, pencarian, filter, detail ✅ → ganti foto & teks dengan aset Halika yang diizinkan owner
- [ ] UI chatbot ✅ & penyimpanan riwayat chat ✅
- [ ] Target: satu alur utama jalan ujung ke ujung (admin ubah stok → katalog & chatbot berubah)

## Minggu 3 (4–10 Des) — integrasi (fitur freeze di akhir minggu)
- [ ] Ganti `ML_API_URL` ke API model asli tim Gen AI, uji kontrak & timeout
- [ ] Aktifkan `GEMINI_API_KEY` (dikoordinasikan dengan Angelia), uji guardrail & fallback
- [ ] **Zelta**: isi `backend/src/data/insights.json` dengan hasil notebook tim DS; cek tampilan dashboard
- [ ] Uji responsif di ponsel, tablet, desktop
- [ ] Semua fitur online

## Minggu 4 (11–20 Des) — uji & dokumentasi
- [ ] Jalankan seluruh `docs/TESTING.md`, catat di spreadsheet
- [ ] Uji coba bersama Co-owner (ketepatan jawaban, selisih stok, waktu respons, feedback)
- [ ] Lengkapi README (URL deploy, tautan model), panduan owner (PDF dengan screenshot)
- [ ] Download ZIP repo (100–200 MB), pastikan tidak ada `.env`/password/API key

## Hal yang harus dipahami setiap anggota (siap ditanya asesor)
* Kenapa frontend tidak memanggil API model langsung (keamanan API key & URL).
* Bagaimana Joi menolak input tidak valid dan bagaimana pesannya sampai ke form.
* Bagaimana chatbot tetap jalan saat API model/LLM mati (fallback & guardrail).
* Bagaimana angka dashboard dihitung (lihat query di `docs/TESTING.md`).
