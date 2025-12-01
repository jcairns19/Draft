import pool from '../database/config.js';

/**
 * Retrieves all restaurants.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with array of restaurants.
 */
export async function getAllRestaurants(req, res) {
  try {
    const result = await pool.query('SELECT id, name, slogan, address, open_time, close_time, image_url, created_at FROM restaurants ORDER BY name');
    res.json({ restaurants: result.rows });
  } catch (err) {
    console.error('Get all restaurants error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Retrieves a single restaurant by ID.
 * @param {Object} req - Express request object with params.id.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with restaurant or error.
 */
export async function getRestaurantById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, name, slogan, address, image_url, open_time, close_time, created_at FROM restaurants WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json({ restaurant: result.rows[0] });
  } catch (err) {
    console.error('Get restaurant by ID error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Retrieves all menu items for a specific restaurant.
 * @param {Object} req - Express request object with params.id (restaurant ID).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with array of menu items or error.
 */
export async function getMenu(req, res) {
  const { id } = req.params;
  try {
    // First check if restaurant exists
    const restaurantCheck = await pool.query('SELECT id FROM restaurants WHERE id = $1', [id]);
    if (restaurantCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const result = await pool.query(`
      SELECT mi.id, mi.type, mi.name, mi.abv, mi.description, mi.image_url, mi.price, mi.created_at
      FROM menu_items mi
      JOIN restaurant_menu_items rmi ON mi.id = rmi.menu_item_id
      WHERE rmi.restaurant_id = $1
      ORDER BY mi.type, mi.name
    `, [id]);
    res.json({ menuItems: result.rows });
  } catch (err) {
    console.error('Get menu error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}