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

-- Restaurants table
-- Stores restaurant information for display or management.
CREATE TABLE IF NOT EXISTS restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slogan TEXT,
  address TEXT NOT NULL,
  image_url TEXT,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menu items table
-- Stores menu items for each restaurant.
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,  -- e.g., 'beer', 'food', 'drink'
  name VARCHAR(255) NOT NULL,
  abv DECIMAL(5,2),  -- Alcohol by volume (e.g., 5.00 for 5%)
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL,  -- Price in dollars (e.g., 12.99)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabs table
-- Stores user tabs at restaurants, tracking open/close times, total, and payment method.
CREATE TABLE IF NOT EXISTS tabs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
  open_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  close_time TIMESTAMP WITH TIME ZONE,
  is_open BOOLEAN DEFAULT TRUE,
  total DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tabs_user_id ON tabs(user_id);
CREATE INDEX IF NOT EXISTS idx_tabs_restaurant_id ON tabs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tabs_payment_method_id ON tabs(payment_method_id);

-- Tab items table
-- Stores items added to a tab, with quantity and calculated sub-price.
CREATE TABLE IF NOT EXISTS tab_items (
  id SERIAL PRIMARY KEY,
  tab_id INTEGER REFERENCES tabs(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  sub_price DECIMAL(10,2) NOT NULL,  -- menu_item.price * quantity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tab_items_tab_id ON tab_items(tab_id);

-- Restaurant menu items mapping table
-- Allows many-to-many relationship between restaurants and menu items (e.g., shared items).
CREATE TABLE IF NOT EXISTS restaurant_menu_items (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(restaurant_id, menu_item_id)  -- Prevent duplicate mappings
);

CREATE INDEX IF NOT EXISTS idx_restaurant_menu_items_restaurant_id ON restaurant_menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menu_items_menu_item_id ON restaurant_menu_items(menu_item_id);
