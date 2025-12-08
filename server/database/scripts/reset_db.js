import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import models, { sequelize } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDatabase() {
  try {
    console.log('Connecting to database...');

    // Sync database: drop and recreate tables
    console.log('Dropping and recreating tables...');
    await sequelize.sync({ force: true });

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
      const createdUser = await models.User.create({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        password_hash: password_hash,
      });
      managerIds.push(createdUser.id);
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
      await models.User.create({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        password_hash: password_hash,
      });
      console.log(`Created test user: ${user.first_name} ${user.last_name} (${user.email})`);
    }

    console.log(`Created ${managerUsers.length} managers and ${testUsers.length} test users.`);

    // Populate restaurants table with dummy data and assign managers
    console.log('Populating restaurants table...');
    const restaurantsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/restaurants.json'), 'utf8'));
    for (let i = 0; i < restaurantsData.length; i++) {
      const restaurant = restaurantsData[i];
      const managerId = managerIds[i % managerIds.length]; // Cycle through managers
      
      await models.Restaurant.create({
        name: restaurant.name,
        slogan: restaurant.slogan,
        address: restaurant.address,
        image_url: restaurant.image_url,
        open_time: restaurant.open_time,
        close_time: restaurant.close_time,
        manager_id: managerId,
      });
      console.log(`Created restaurant: ${restaurant.name} (Manager ID: ${managerId})`);
    }
    console.log(`Inserted ${restaurantsData.length} restaurants.`);

    // Populate menu_items table with dummy data
    console.log('Populating menu_items table...');
    const menuItemsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/menu_items.json'), 'utf8'));
    for (const item of menuItemsData) {
      await models.MenuItem.create({
        type: item.type,
        name: item.name,
        abv: item.abv,
        description: item.description,
        image_url: item.image_url,
        price: item.price,
      });
    }
    console.log(`Inserted ${menuItemsData.length} menu items.`);

    // Populate restaurant_menu_items junction table
    console.log('Populating restaurant_menu_items table...');
    const restaurantMenuMappings = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/restaurant_menu_mappings.json'), 'utf8'));

    for (const mapping of restaurantMenuMappings) {
      for (const menuItemId of mapping.menu_item_ids) {
        await models.RestaurantMenuItem.create({
          restaurant_id: mapping.restaurant_id,
          menu_item_id: menuItemId,
        });
      }
    }
    console.log(`Inserted restaurant-menu item mappings for ${restaurantMenuMappings.length} restaurants.`);

    // Create payment methods for test users
    console.log('Creating payment methods for test users...');
    const testUserEmails = ['alice@example.com', 'bob@example.com', 'charlie@example.com'];
    
    for (const email of testUserEmails) {
      // Get user ID
      const user = await models.User.findOne({ where: { email } });
      const userId = user.id;
      
      // Create a payment method
      await models.PaymentMethod.create({
        user_id: userId,
        card_number: '4111111111111111', // Test card number
        card_cvc: '123',
        card_holder_name: `${email.split('@')[0]} User`,
        card_brand: 'Visa',
        card_exp_month: 12,
        card_exp_year: 2026,
        billing_address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          country: 'US'
        },
        is_default: true,
      });
      console.log(`Created payment method for ${email}`);
    }

    console.log('Database reset complete!');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

resetDatabase();