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

    console.log('Database reset complete!');
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();