-- =============================================================
-- DATA CONTOH (DUMMY) — BUKAN DATA OPERASIONAL ASLI HALIKA.CLO
-- Dibuat tim untuk pengembangan & pengujian. Nama, harga, dan stok
-- adalah fiktif. Ganti dengan data hasil cleaning tim Data Science
-- (data pembukuan owner) sebelum demo ke UMKM.
-- Foto: Unsplash (placeholder dari mockup), ganti dengan foto produk
-- yang sudah diizinkan owner.
-- Akun admin TIDAK dibuat di sini -> gunakan `npm run seed:admin`.
-- =============================================================

SET NAMES utf8mb4;

INSERT INTO products (id, name, slug, category, description, material, price, image_url) VALUES
(1, 'Aruna Linen Dress', 'aruna-linen-dress', 'Dress', 'Dress linen dengan siluet A-line yang ringan dan jatuh. Nyaman untuk acara maupun keseharian.', 'Linen', 489000, 'https://images.unsplash.com/photo-1630420897726-e29b969ad5b2?auto=format&fit=crop&w=900&q=80'),
(2, 'Senja Pleated Blouse', 'senja-pleated-blouse', 'Atasan', 'Blouse dengan detail lipit di bagian depan, cocok dipadukan dengan rok atau celana kulot.', 'Katun Rayon', 329000, 'https://images.unsplash.com/photo-1604300834574-252c0c25d1c1?auto=format&fit=crop&w=900&q=80'),
(3, 'Kirana Floral Dress', 'kirana-floral-dress', 'Dress', 'Dress motif bunga dengan potongan midi dan tali pinggang.', 'Rayon', 529000, 'https://images.unsplash.com/photo-1602160148752-e9827433bb79?auto=format&fit=crop&w=900&q=80'),
(4, 'Larissa Daily Set', 'larissa-daily-set', 'Set', 'Setelan atasan dan celana kulot untuk aktivitas harian.', 'Katun', 619000, 'https://images.unsplash.com/photo-1672393798884-868d22a4151d?auto=format&fit=crop&w=900&q=80'),
(5, 'Nala Basic Tunik', 'nala-basic-tunik', 'Atasan', 'Tunik panjang basic dengan kancing depan, ramah busui.', 'Katun Toyobo', 259000, 'https://images.unsplash.com/photo-1604300834574-252c0c25d1c1?auto=format&fit=crop&w=900&q=80'),
(6, 'Sekar Kulot Pants', 'sekar-kulot-pants', 'Bawahan', 'Celana kulot high waist dengan karet di belakang.', 'Wolfis', 199000, 'https://images.unsplash.com/photo-1672393798884-868d22a4151d?auto=format&fit=crop&w=900&q=80'),
(7, 'Ayu Outer Cardigan', 'ayu-outer-cardigan', 'Outer', 'Outer rajut ringan untuk dipakai di atas dress atau blouse.', 'Rajut', 279000, 'https://images.unsplash.com/photo-1630420897726-e29b969ad5b2?auto=format&fit=crop&w=900&q=80'),
(8, 'Dara Satin Skirt', 'dara-satin-skirt', 'Bawahan', 'Rok satin plisket panjang dengan kilau lembut.', 'Satin', 239000, 'https://images.unsplash.com/photo-1602160148752-e9827433bb79?auto=format&fit=crop&w=900&q=80');

INSERT INTO product_variants (product_id, size, color, stock) VALUES
(1,'S','Oatmeal',4),(1,'M','Oatmeal',6),(1,'L','Oatmeal',2),(1,'M','Dusty Pink',3),(1,'L','Dusty Pink',0),
(2,'S','Putih',5),(2,'M','Putih',7),(2,'L','Putih',1),(2,'M','Hitam',4),(2,'XL','Hitam',2),
(3,'S','Sage',2),(3,'M','Sage',5),(3,'L','Sage',3),(3,'M','Navy',1),
(4,'M','Mocca',3),(4,'L','Mocca',2),(4,'XL','Mocca',0),(4,'M','Hitam',4),
(5,'All Size','Hitam',8),(5,'All Size','Maroon',2),(5,'All Size','Cream',5),
(6,'S','Hitam',6),(6,'M','Hitam',9),(6,'L','Hitam',4),(6,'M','Cream',1),
(7,'All Size','Cream',3),(7,'All Size','Mocca',0),
(8,'All Size','Champagne',2),(8,'All Size','Hitam',5),(8,'All Size','Sage',1);

-- Contoh riwayat chat (dummy) agar dashboard tidak kosong saat pengembangan.
INSERT INTO chat_logs (session_id, message, intent, confidence, intent_source, product_id, size, color, answer, llm_used, response_ms, created_at) VALUES
('seed-1','aruna linen dress ukuran M masih ada?','tanya_stok',0.9100,'model',1,'M',NULL,'(dummy)',0,420,NOW() - INTERVAL 6 DAY),
('seed-1','warna apa aja yang aruna?','tanya_warna_bahan',0.8800,'model',1,NULL,NULL,'(dummy)',0,390,NOW() - INTERVAL 6 DAY),
('seed-2','bahan kirana floral dress apa kak','tanya_warna_bahan',0.8600,'model',3,NULL,NULL,'(dummy)',0,410,NOW() - INTERVAL 5 DAY),
('seed-3','senja blouse ada size XL?','tanya_ukuran',0.8200,'model',2,'XL',NULL,'(dummy)',0,380,NOW() - INTERVAL 4 DAY),
('seed-4','stok aruna warna dusty pink L','tanya_stok',0.9300,'model',1,'L','Dusty Pink','(dummy)',0,450,NOW() - INTERVAL 3 DAY),
('seed-5','kulot sekar hitam M ready?','tanya_stok',0.9000,'model',6,'M','Hitam','(dummy)',0,400,NOW() - INTERVAL 2 DAY),
('seed-6','siapa presiden indonesia?','di_luar_konteks',0.9500,'model',NULL,NULL,NULL,'(dummy)',0,300,NOW() - INTERVAL 1 DAY),
('seed-7','larissa set ukurannya apa aja','tanya_ukuran',0.8400,'model',4,NULL,NULL,'(dummy)',0,430,NOW());
