import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDatabase() {
  try {
    console.log('Connecting to database...');

    // Read drop script
    const dropScript = fs.readFileSync(path.join(__dirname, '../schema/drop_tables.sql'), 'utf8');
    console.log('Dropping tables...');
    await pool.query(dropScript);

    // Read create script
    const createScript = fs.readFileSync(path.join(__dirname, '../schema/create_tables.sql'), 'utf8');
    console.log('Creating tables...');
    await pool.query(createScript);

    // Populate restaurants table with dummy data
    console.log('Populating restaurants table...');
    const restaurantsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/restaurants.json'), 'utf8'));
    for (const restaurant of restaurantsData) {
      await pool.query(
        'INSERT INTO restaurants (name, slogan, address, image_url, open_time, close_time) VALUES ($1, $2, $3, $4, $5, $6)',
        [restaurant.name, restaurant.slogan, restaurant.address, restaurant.image_url, restaurant.open_time, restaurant.close_time]
      );
    }
    console.log(`Inserted ${restaurantsData.length} restaurants.`);

    // Populate menu_items table with dummy data
    console.log('Populating menu_items table...');
    const menuItemsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/menu_items.json'), 'utf8'));
    for (const item of menuItemsData) {
      await pool.query(
        'INSERT INTO menu_items (type, name, abv, description, image_url, price) VALUES ($1, $2, $3, $4, $5, $6)',
        [item.type, item.name, item.abv, item.description, item.image_url, item.price]
      );
    }
    console.log(`Inserted ${menuItemsData.length} menu items.`);

    // Populate restaurant_menu_items junction table
    console.log('Populating restaurant_menu_items table...');
    const restaurantMenuMappings = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/restaurant_menu_mappings.json'), 'utf8'));

    for (const mapping of restaurantMenuMappings) {
      for (const menuItemId of mapping.menu_item_ids) {
        await pool.query(
          'INSERT INTO restaurant_menu_items (restaurant_id, menu_item_id) VALUES ($1, $2)',
          [mapping.restaurant_id, menuItemId]
        );
      }
    }
    console.log(`Inserted restaurant-menu item mappings for ${restaurantMenuMappings.length} restaurants.`);
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();