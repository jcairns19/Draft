import jwt from 'jsonwebtoken';
import pool from '../database/config.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

// Express middleware to verify bearer JWT tokens.
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Malformed Authorization header' });
  }

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Attach user info to request (we'll fetch fresh user from DB)
    const { userId } = payload;
    if (!userId) return res.status(401).json({ error: 'Invalid token payload' });

    // Optional: load user details from DB to attach to req.user
    const result = await pool.query('SELECT id, first_name, last_name, email, profile_picture_url, created_at FROM users WHERE id = $1', [userId]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'User not found' });

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function signToken(user) {
  const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
  const JWT_SECRET_LOCAL = process.env.JWT_SECRET || JWT_SECRET;
  return jwt.sign({ userId: user.id }, JWT_SECRET_LOCAL, { expiresIn: JWT_EXPIRES });
}

export default { authenticateToken, signToken };
