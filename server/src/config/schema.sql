CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(80) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('Umum','Penting','Rahasia')),
  letter_date DATE NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('Masuk','Keluar')),
  original_filename TEXT,
  stored_filename TEXT,
  mime_type TEXT,
  file_size BIGINT,
  secret_password_hash TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE letters ADD COLUMN IF NOT EXISTS secret_password_hash TEXT;
CREATE INDEX IF NOT EXISTS letters_date_idx ON letters(letter_date DESC);
CREATE INDEX IF NOT EXISTS letters_category_idx ON letters(category);
CREATE TABLE IF NOT EXISTS village_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  event_title VARCHAR(255),
  event_date DATE,
  location VARCHAR(255),
  leader VARCHAR(180),
  notetaker VARCHAR(180),
  participants TEXT,
  agenda TEXT,
  results TEXT,
  notes TEXT,
  image_filename TEXT,
  image_mime VARCHAR(80),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  author_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE village_news ADD COLUMN IF NOT EXISTS image_filename TEXT;
ALTER TABLE village_news ADD COLUMN IF NOT EXISTS image_mime VARCHAR(80);
CREATE INDEX IF NOT EXISTS village_news_status_date_idx ON village_news(status,event_date DESC,created_at DESC);
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
