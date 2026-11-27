-- =============================================================
-- Halika.Clo — Skema Database MySQL 8
-- Jalankan: npm run db:init (di folder backend) atau import manual.
-- =============================================================

SET NAMES utf8mb4;

DROP TABLE IF EXISTS chat_logs;
DROP TABLE IF EXISTS stock_logs;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- Akun admin (owner & co-owner). Password disimpan sebagai hash bcrypt.
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('owner', 'co_owner') NOT NULL DEFAULT 'owner',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data utama produk (satu baris = satu model pakaian).
CREATE TABLE products (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(140) NOT NULL UNIQUE,
  category    VARCHAR(50)  NOT NULL,
  description TEXT NULL,
  material    VARCHAR(100) NOT NULL,
  price       INT UNSIGNED NOT NULL,
  image_url   VARCHAR(500) NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category),
  INDEX idx_products_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stok terpusat per kombinasi ukuran x warna.
CREATE TABLE product_variants (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  size       VARCHAR(10) NOT NULL,
  color      VARCHAR(40) NOT NULL,
  stock      INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_variant_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT uq_variant UNIQUE (product_id, size, color),
  INDEX idx_variant_stock (stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jejak perubahan stok oleh admin (membantu cek selisih stok sistem vs fisik).
CREATE TABLE stock_logs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  variant_id  INT UNSIGNED NULL,
  product_id  INT UNSIGNED NULL,
  old_stock   INT NULL,
  new_stock   INT NOT NULL,
  changed_by  INT UNSIGNED NULL,
  note        VARCHAR(255) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stocklog_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  CONSTRAINT fk_stocklog_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_stocklog_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Riwayat percakapan chatbot = riwayat hasil inferensi layanan Gen AI.
CREATE TABLE chat_logs (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id   VARCHAR(64) NOT NULL,
  message      TEXT NOT NULL,
  intent       VARCHAR(40) NOT NULL,
  confidence   DECIMAL(5,4) NULL,
  intent_source ENUM('model', 'fallback') NOT NULL DEFAULT 'model',
  product_id   INT UNSIGNED NULL,
  size         VARCHAR(10) NULL,
  color        VARCHAR(40) NULL,
  answer       TEXT NOT NULL,
  llm_used     TINYINT(1) NOT NULL DEFAULT 0,
  response_ms  INT UNSIGNED NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_chat_intent (intent),
  INDEX idx_chat_created (created_at),
  INDEX idx_chat_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
