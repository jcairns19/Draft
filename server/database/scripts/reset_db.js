import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
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

    // Populate users table with dummy data (including managers)
    console.log('Populating users table...');
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    
    // Create manager users
    const managerUsers = [
      { first_name: 'John', last_name: 'Smith', email: 'john.smith@draftbar.com', password: 'manager123' },
      { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@draftbar.com', password: 'manager123' },
      { first_name: 'Mike', last_name: 'Davis', email: 'mike.davis@draftbar.com', password: 'manager123' }
    ];

    const managerIds = [];
    for (const user of managerUsers) {
      const password_hash = await bcrypt.hash(user.password, saltRounds);
      const result = await pool.query(
        'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
        [user.first_name, user.last_name, user.email, password_hash]
      );
      managerIds.push(result.rows[0].id);
      console.log(`Created manager: ${user.first_name} ${user.last_name} (${user.email})`);
    }

    // Create regular test users
    const testUsers = [
      { first_name: 'Alice', last_name: 'Brown', email: 'alice@example.com', password: 'password123' },
      { first_name: 'Bob', last_name: 'Wilson', email: 'bob@example.com', password: 'password123' },
      { first_name: 'Charlie', last_name: 'Taylor', email: 'charlie@example.com', password: 'password123' }
    ];

    for (const user of testUsers) {
      const password_hash = await bcrypt.hash(user.password, saltRounds);
      await pool.query(
        'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4)',
        [user.first_name, user.last_name, user.email, password_hash]
      );
      console.log(`Created test user: ${user.first_name} ${user.last_name} (${user.email})`);
    }

    console.log(`Created ${managerUsers.length} managers and ${testUsers.length} test users.`);

    // Populate restaurants table with dummy data and assign managers
    console.log('Populating restaurants table...');
    const restaurantsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/restaurants.json'), 'utf8'));
    for (let i = 0; i < restaurantsData.length; i++) {
      const restaurant = restaurantsData[i];
      const managerId = managerIds[i % managerIds.length]; // Cycle through managers
      
      await pool.query(
        'INSERT INTO restaurants (name, slogan, address, image_url, open_time, close_time, manager_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [restaurant.name, restaurant.slogan, restaurant.address, restaurant.image_url, restaurant.open_time, restaurant.close_time, managerId]
      );
      console.log(`Created restaurant: ${restaurant.name} (Manager ID: ${managerId})`);
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

    // Create payment methods for test users
    console.log('Creating payment methods for test users...');
    const testUserEmails = ['alice@example.com', 'bob@example.com', 'charlie@example.com'];
    
    for (const email of testUserEmails) {
      // Get user ID
      const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      const userId = userResult.rows[0].id;
      
      // Create a payment method
      await pool.query(
        `INSERT INTO payment_methods (user_id, card_number, card_cvc, card_holder_name, card_brand, card_exp_month, card_exp_year, billing_address, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          '4111111111111111', // Test card number
          '123',
          `${email.split('@')[0]} User`,
          'Visa',
          12,
          2026,
          JSON.stringify({
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zip: '12345',
            country: 'US'
          }),
          true
        ]
      );
      console.log(`Created payment method for ${email}`);
    }

    console.log('Database reset complete!');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();