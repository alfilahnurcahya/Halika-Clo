# Rencana & Catatan Pengujian (Full-Stack)

Catat hasil di spreadsheet tim (kolom: fitur, tanggal, hasil, status perbaikan, penanggung jawab).

## A. Otomatis
`cd backend && npm test` — logika chatbot (ekstraksi, jawaban dari data, 10 pertanyaan di luar konteks, guardrail LLM).

## B. Manual

| # | Fitur | Langkah | Hasil yang diharapkan |
|---|---|---|---|
| 1 | Katalog | Buka `/koleksi` | Produk sesuai tabel `products` (is_active=1), skeleton saat memuat |
| 2 | Pencarian | Cari "linen", lalu "zzzz" | Hasil relevan; "zzzz" → pesan "Produk tidak ditemukan" |
| 3 | Filter | Pilih kategori Dress + ukuran M + "ready stok" | Hanya produk yang punya varian sesuai |
| 4 | Detail | Pilih warna & ukuran | Stok per varian sesuai DB; ukuran stok 0 tidak bisa dipilih |
| 5 | Login | Buka `/admin` tanpa login | Diarahkan ke halaman login |
| 6 | Login salah | Password salah | Pesan "Email atau password salah." |
| 7 | API tanpa token | `curl -X POST .../api/v1/products` | 401 |
| 8 | Tambah produk | Isi form valid | Toast hijau, produk muncul di katalog |
| 9 | Validasi | Nama kosong, harga 0, stok -1 / huruf | Ditolak, pesan merah per field (frontend & Joi backend) |
| 10 | Duplikat varian | Dua varian M/Hitam | Ditolak "Kombinasi ukuran & warna ganda" |
| 11 | Ubah stok | Stok Aruna M Oatmeal → 1 | Toast hijau, tercatat di `stock_logs` |
| 12 | Chatbot setelah stok diubah | Tanya "aruna M oatmeal ada?" | Jawaban menyebut 1 pcs |
| 13 | Chatbot di luar konteks | 10 pertanyaan (lihat test) | Ditolak sopan, tidak mengarang |
| 14 | Pesan kosong | Kirim spasi / 1 huruf | Tombol kirim nonaktif; backend 400 |
| 15 | API model mati | Matikan ml-service | Chatbot tetap menjawab + label "Mode cadangan" |
| 16 | LLM gagal | Isi `GEMINI_API_KEY` salah | Jawaban template, tidak error |
| 17 | Backend mati | Matikan backend | Katalog menampilkan "Data gagal dimuat" + tombol Coba lagi; chat menampilkan pesan & "Kirim ulang" |
| 18 | Riwayat chat | Buka `/admin/chat` | Pertanyaan baru tersimpan dengan intent & waktu |
| 19 | Dashboard | Bandingkan angka dengan query SQL | Sama (lihat bagian C) |
| 20 | Responsif | Buka di ponsel (≤ 400px), tablet, desktop | Tidak ada elemen terpotong / scroll horizontal |

## C. Query verifikasi angka dashboard
```sql
-- Varian stok menipis (threshold 3)
SELECT COUNT(*) FROM product_variants v JOIN products p ON p.id=v.product_id WHERE p.is_active=1 AND v.stock>0 AND v.stock<=3;
-- Produk paling sering ditanyakan 30 hari
SELECT p.name, COUNT(*) n FROM chat_logs c JOIN products p ON p.id=c.product_id
WHERE c.created_at >= NOW() - INTERVAL 30 DAY AND c.intent <> 'di_luar_konteks' GROUP BY p.name ORDER BY n DESC;
```

## D. Uji coba bersama Co-owner (dicatat)
Ketepatan jawaban chatbot (jawaban benar / total), selisih stok sistem vs fisik per produk, waktu respons (`response_ms` di riwayat chat), dan feedback.
