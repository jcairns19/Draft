-- Drop all tables in the database with CASCADE
-- This will remove all data and dependent objects (indexes, constraints, etc.)
-- Use with caution!

DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS drafts CASCADE;  -- In case it exists from previous schema
DROP TABLE IF EXISTS restaurant_menu_items CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS tab_items CASCADE;
DROP TABLE IF EXISTS tabs CASCADE;