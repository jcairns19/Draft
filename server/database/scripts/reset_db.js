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
    // Define mappings: item_id to restaurant_ids
    const mappings = [
      { item_id: 1, restaurant_ids: [1] },
      { item_id: 2, restaurant_ids: [1] },
      { item_id: 3, restaurant_ids: [1] },
      { item_id: 4, restaurant_ids: [2] },
      { item_id: 5, restaurant_ids: [2] },
      { item_id: 6, restaurant_ids: [3] },
      { item_id: 7, restaurant_ids: [3] },
      { item_id: 8, restaurant_ids: [4] },
      { item_id: 9, restaurant_ids: [4] },
      { item_id: 10, restaurant_ids: [5] },
      { item_id: 11, restaurant_ids: [6] },
      { item_id: 12, restaurant_ids: [6] },
      { item_id: 13, restaurant_ids: [7] },
      { item_id: 14, restaurant_ids: [7] },
      { item_id: 15, restaurant_ids: [8] },
      { item_id: 16, restaurant_ids: [8] },
      { item_id: 17, restaurant_ids: [9] },
      { item_id: 18, restaurant_ids: [9] },
      { item_id: 19, restaurant_ids: [10] },
      { item_id: 20, restaurant_ids: [10] },
      { item_id: 21, restaurant_ids: [1] },
      { item_id: 22, restaurant_ids: [1] },
      { item_id: 23, restaurant_ids: [2] },
      { item_id: 24, restaurant_ids: [2] },
      { item_id: 25, restaurant_ids: [3] },
      { item_id: 26, restaurant_ids: [3] },
      { item_id: 27, restaurant_ids: [4] },
      { item_id: 28, restaurant_ids: [4] },
      { item_id: 29, restaurant_ids: [5] },
      { item_id: 30, restaurant_ids: [5] },
      { item_id: 31, restaurant_ids: [6] },
      { item_id: 32, restaurant_ids: [6] },
      { item_id: 33, restaurant_ids: [7] },
      { item_id: 34, restaurant_ids: [7] },
      { item_id: 35, restaurant_ids: [8] },
      { item_id: 36, restaurant_ids: [8] },
      { item_id: 37, restaurant_ids: [9] },
      { item_id: 38, restaurant_ids: [9] },
      { item_id: 39, restaurant_ids: [10] },
      { item_id: 40, restaurant_ids: [10] }
    ];
    for (const mapping of mappings) {
      for (const restaurant_id of mapping.restaurant_ids) {
        await pool.query(
          'INSERT INTO restaurant_menu_items (restaurant_id, menu_item_id) VALUES ($1, $2)',
          [restaurant_id, mapping.item_id]
        );
      }
    }
    console.log('Inserted restaurant-menu item mappings.');
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();