import pool from '../database/config.js';
import logger from '../logger.js';

/**
 * Retrieves all restaurants.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with array of restaurants.
 */
export async function getAllRestaurants(req, res) {
  try {
    const result = await pool.query('SELECT id, name, slogan, address, open_time, close_time, image_url, manager_id, created_at FROM restaurants ORDER BY name');
    res.json({ restaurants: result.rows });
  } catch (err) {
    logger.error('Get all restaurants error', err);
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
    const result = await pool.query('SELECT id, name, slogan, address, image_url, open_time, close_time, manager_id, created_at FROM restaurants WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json({ restaurant: result.rows[0] });
  } catch (err) {
    logger.error('Get restaurant by ID error', err);
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

    // Parse numeric fields
    const menuItems = result.rows.map(item => ({
      ...item,
      price: parseFloat(item.price),
      abv: item.abv ? parseFloat(item.abv) : null
    }));

    res.json({ menuItems: menuItems });
  } catch (err) {
    logger.error('Get menu error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Checks if the current user is a restaurant manager.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with isManager boolean.
 */
export async function checkManagerStatus(req, res) {
  const manager_id = req.user.id;

  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM restaurants WHERE manager_id = $1', [manager_id]);
    const isManager = parseInt(result.rows[0].count) > 0;
    res.json({ isManager });
  } catch (err) {
    logger.error('Check manager status error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Retrieves all open tabs for a restaurant (for managers).
 * @param {Object} req - Express request object with params.id (restaurant ID).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with open tabs or error.
 */
export async function getManagerTabs(req, res) {
  const manager_id = req.user.id;

  try {
    // Get all restaurants managed by this user
    const restaurantsResult = await pool.query('SELECT id, name FROM restaurants WHERE manager_id = $1', [manager_id]);

    // Get all open tabs for these restaurants
    const restaurantsWithTabs = await Promise.all(
      restaurantsResult.rows.map(async (restaurant) => {
        const tabsResult = await pool.query(
          'SELECT t.id, t.user_id, t.restaurant_id, t.is_open, t.created_at FROM tabs t WHERE t.restaurant_id = $1 AND t.is_open = true ORDER BY t.created_at',
          [restaurant.id]
        );

        // Get items for each tab
        const tabsWithItems = await Promise.all(
          tabsResult.rows.map(async (tab) => {
            const itemsResult = await pool.query(
              'SELECT ti.id, ti.quantity, ti.sub_price as price, ti.served, mi.name FROM tab_items ti JOIN menu_items mi ON ti.menu_item_id = mi.id WHERE ti.tab_id = $1 ORDER BY ti.created_at',
              [tab.id]
            );

            return {
              ...tab,
              tab_items: itemsResult.rows.map(item => ({
                ...item,
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity),
                served: Boolean(item.served),
                menu_item: { name: item.name }
              }))
            };
          })
        );

        return {
          ...restaurant,
          tabs: tabsWithItems
        };
      })
    );

    res.json(restaurantsWithTabs);
  } catch (err) {
    logger.error('Get manager tabs error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Retrieves all open tabs for a restaurant (for managers).
 * @param {Object} req - Express request object with params.id (restaurant ID).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with open tabs or error.
 */
export async function getOpenTabsForRestaurant(req, res) {
  const { id } = req.params;
  const manager_id = req.user.id;

  try {
    // First verify the user is the manager of this restaurant
    const restaurantCheck = await pool.query('SELECT id FROM restaurants WHERE id = $1 AND manager_id = $2', [id, manager_id]);
    if (restaurantCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Access denied. You are not the manager of this restaurant.' });
    }

    // Get all open tabs with their items
    const tabsResult = await pool.query(
      'SELECT t.id, t.user_id, t.restaurant_id, t.open_time, t.is_open, t.total FROM tabs t WHERE t.restaurant_id = $1 AND t.is_open = true ORDER BY t.open_time',
      [id]
    );

    // Get items for each tab
    const tabsWithItems = await Promise.all(
      tabsResult.rows.map(async (tab) => {
        const itemsResult = await pool.query(
          'SELECT ti.id, ti.quantity, ti.sub_price, ti.served, mi.name, mi.type FROM tab_items ti JOIN menu_items mi ON ti.menu_item_id = mi.id WHERE ti.tab_id = $1 ORDER BY ti.created_at',
          [tab.id]
        );

        return {
          ...tab,
          items: itemsResult.rows.map(item => ({
            ...item,
            sub_price: parseFloat(item.sub_price),
            quantity: parseInt(item.quantity),
            served: Boolean(item.served)
          }))
        };
      })
    );

    res.json({ tabs: tabsWithItems });
  } catch (err) {
    logger.error('Get open tabs for restaurant error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}