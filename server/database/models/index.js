import { Sequelize } from 'sequelize';
import logger from '../../logger.js';

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'draft_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  logging: (msg) => logger.debug(msg), // Use Winston for logging
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test connection
try {
  await sequelize.authenticate();
  logger.info('Sequelize connected to PostgreSQL database');
} catch (error) {
  logger.error('Unable to connect to the database:', error);
}

// Import models
import User from './User.js';
import PaymentMethod from './PaymentMethod.js';
import Restaurant from './Restaurant.js';
import MenuItem from './MenuItem.js';
import Tab from './Tab.js';
import TabItem from './TabItem.js';
import RestaurantMenuItem from './RestaurantMenuItem.js';

// Initialize models
const models = {
  User: User(sequelize),
  PaymentMethod: PaymentMethod(sequelize),
  Restaurant: Restaurant(sequelize),
  MenuItem: MenuItem(sequelize),
  Tab: Tab(sequelize),
  TabItem: TabItem(sequelize),
  RestaurantMenuItem: RestaurantMenuItem(sequelize),
};

// Define associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Sync database (optional, for development)
if (process.env.NODE_ENV === 'development') {
  // Removed auto-sync; use reset_db.js for schema changes
  // await sequelize.sync({ alter: true });
  // logger.info('Database synchronized');
}

export { sequelize };
export default models;