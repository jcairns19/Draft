import bcrypt from 'bcryptjs';
import pool from '../database/config.js';
import auth from '../middleware/auth.js';
import logger from '../logger.js';

/**
 * Handles user signup by creating a new user account.
 * Validates input, checks for existing email, hashes password, and inserts into database.
 * Returns the created user and a JWT token.
 * @param {Object} req - Express request object with body containing first_name, last_name, email, password, profile_picture_url (optional).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with user and token on success, or error on failure.
 */
export async function signup(req, res) {
  const { first_name, last_name, email, password, profile_picture_url } = req.body || {};
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'first_name, last_name, email and password are required' });
  }

  try {
    // Check existing email
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rowCount > 0) return res.status(409).json({ error: 'Email already in use' });

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const password_hash = await bcrypt.hash(password, saltRounds);

    const insert = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, profile_picture_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, profile_picture_url, created_at`,
      [first_name, last_name, email, password_hash, profile_picture_url || null]
    );

    const user = insert.rows[0];
    // Optionally sign a token and return it on signup
    const token = auth.signToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    logger.error('Signup error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handles user login by verifying credentials and issuing a JWT token.
 * Checks email and password, compares hashed password, and returns user and token.
 * @param {Object} req - Express request object with body containing email and password.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with user and token on success, or error on failure.
 */
export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const result = await pool.query('SELECT id, first_name, last_name, email, password_hash, profile_picture_url FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = auth.signToken(user);
    // Do not leak password_hash
    delete user.password_hash;
    return res.json({ user, token });
  } catch (err) {
    logger.error('Login error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Returns the current authenticated user's information.
 * Requires authentication middleware to populate req.user.
 * @param {Object} req - Express request object with req.user populated by auth middleware.
 * @param {Object} res - Express response object.
 * @returns {void} Sends JSON response with user object.
 */
export function getMe(req, res) {
  // req.user is populated by middleware
  res.json({ user: req.user });
}

/**
 * Handles user logout by invalidating the current session.
 * In JWT-based auth, this typically means the client discards the token.
 * Server-side, we can optionally blacklist the token if implemented.
 * @param {Object} req - Express request object with req.user populated by auth middleware.
 * @param {Object} res - Express response object.
 * @returns {void} Sends JSON response confirming logout.
 */
export function logout(req, res) {
  // For stateless JWT, logout is client-side (discard token).
  // If implementing token blacklist, add logic here to invalidate req.token.
  res.json({ message: 'Logged out successfully. Please discard your token.' });
}