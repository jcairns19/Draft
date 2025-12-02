import pkg from 'pg';
const { Pool } = pkg;
import logger from '../logger.js';

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'draft_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Test connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;