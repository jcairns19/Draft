-- Sample schema for Draft application
-- Run this script to set up initial database tables

-- Users table
-- Stores user identity and authentication data. Passwords must be stored as
-- secure hashes (bcrypt/argon2). Do NOT store plaintext card numbers in the
-- database; store only payment provider tokens or the last4 + brand if using
-- a PCI-compliant tokenization service (e.g. Stripe).
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  -- store a password hash (bcrypt/argon2). 60-255 chars depending on algorithm
  password_hash VARCHAR(255) NOT NULL,
  -- URL pointing to a profile image saved on the server or CDN
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods (one-to-many with users)
-- NOTE: This table stores full card data for dummy/test purposes only.
-- Do NOT use this structure fo/*  */r real card data in production. If you
-- ever move to production or handle real cards, switch to tokenization
-- (Stripe, etc.) and remove direct card storage.
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  -- Direct card fields (for testing/dummy data only)
  card_number VARCHAR(25) NOT NULL,
  card_cvc VARCHAR(4) NOT NULL,
  card_holder_name VARCHAR(255),
  card_brand VARCHAR(50),
  card_exp_month SMALLINT,
  card_exp_year SMALLINT,
  billing_address JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);