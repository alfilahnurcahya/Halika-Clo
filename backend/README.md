# Halika.Clo Backend

Backend katalog dan manajemen stok Halika.Clo. Fondasi saat ini menyediakan Express.js, health check, dan koneksi PostgreSQL melalui Prisma ORM. Model bisnis belum ditambahkan.

## Teknologi

- Node.js 22 atau lebih baru
- Express.js 4 dan JavaScript ES Modules
- Prisma ORM 7.10.1
- PostgreSQL dengan `pg` dan Prisma driver adapter `@prisma/adapter-pg`
- dotenv dan Helmet

## Struktur folder

```text
backend/
├── prisma/
│   └── schema.prisma          # PostgreSQL provider dan generator Prisma
├── prisma7.config.ts          # Konfigurasi Prisma CLI 7.10+
├── src/
│   ├── app.js                 # Konfigurasi Express dan susunan middleware
│   ├── server.js              # Koneksi DB, startup HTTP, dan shutdown
│   ├── config/
│   │   ├── env.js             # Environment aplikasi
│   │   └── database.js        # Singleton Prisma Client dan pemeriksaan DB
│   ├── controllers/           # Handler request/response per fitur
│   ├── middlewares/           # Middleware not found dan error handler
│   ├── routes/                # Pemetaan endpoint ke controller
│   ├── services/              # Lokasi logika bisnis fitur mendatang
│   ├── repositories/          # Lokasi akses data fitur mendatang
│   ├── validators/            # Lokasi validasi request fitur mendatang
│   └── utils/                 # Utilitas response dan error aplikasi
├── tests/                     # Lokasi pengujian
├── .env.example               # Contoh konfigurasi tanpa secret
└── package.json
```

## Persyaratan PostgreSQL dan setup lokal

Pastikan PostgreSQL berjalan dan `psql` tersedia bila ingin membuat database dari command line. Buat database `halika_clo` (misalnya menggunakan akun PostgreSQL lokal):

```sql
CREATE DATABASE halika_clo;
```

Atau dari terminal:

```bash
createdb -U postgres halika_clo
```

Salin `.env.example` menjadi `.env`, lalu masukkan nama pengguna dan password PostgreSQL lokal ke URL koneksi. Jangan commit `.env`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/halika_clo?schema=public"
```

Contoh tersebut menggunakan placeholder. Ganti `USER` dan `PASSWORD` dengan akun lokal Anda.

## Instalasi dan perintah Prisma

Dari folder `backend` jalankan:

```bash
npm install
npm run prisma:validate
npm run prisma:generate
```

`prisma validate` memeriksa schema. `prisma generate` membuat Prisma Client. Keduanya membaca `.env` melalui `prisma7.config.ts`. Schema saat ini belum berisi model bisnis, sehingga belum ada tabel yang dibuat. Saat model ditambahkan pada tahap berikutnya, migrasi lokal dapat dijalankan dengan `npx prisma migrate dev --name init`.

## Menguji koneksi database

Jalankan server setelah `.env` berisi URL koneksi yang benar:

```bash
npm start
```

Saat startup, server menjalankan koneksi Prisma dan query `SELECT 1`. Keberhasilan dicatat di log. Jika database tidak tersedia, server tetap menyalakan HTTP agar health check dapat menunjukkan status database sebagai `disconnected`; detail kegagalan dicatat di log server dan tidak diekspos di response publik.

Periksa `GET http://localhost:3000/api/health` melalui browser, curl, atau Postman. Jika DB terhubung, bagian status DB bernilai `connected`:

```json
{
  "success": true,
  "message": "Service is healthy.",
  "data": {
    "status": "ok",
    "database": { "status": "connected" },
    "timestamp": "2026-11-19T00:00:00.000Z"
  }
}
```

Jika DB gagal dihubungi, endpoint tetap melaporkan kondisi server dan menampilkan `database.status` sebagai `disconnected`.

## Menjalankan server

Mode watch:

```bash
npm run dev
```

Mode normal:

```bash
npm start
```

Environment yang digunakan: `NODE_ENV` (default `development`), `PORT` (default `3000`), dan `DATABASE_URL` (wajib untuk koneksi database).
