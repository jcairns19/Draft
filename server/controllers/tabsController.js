import pool from '../database/config.js';
import logger from '../logger.js';

/**
 * Creates a new tab for a user at a restaurant.
 * Users can only have one open tab per restaurant at a time.
 * @param {Object} req - Express request object with body.restaurant_id
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends JSON response with created tab or error
 */
export async function createTab(req, res) {
  const { restaurant_id } = req.body;
  const user_id = req.user.id;

  try {
    // Check if restaurant exists
    const restaurantCheck = await pool.query('SELECT id FROM restaurants WHERE id = $1', [restaurant_id]);
    if (restaurantCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check if user already has an open tab at this restaurant
    const existingTab = await pool.query(
      'SELECT id FROM tabs WHERE user_id = $1 AND restaurant_id = $2 AND is_open = true',
      [user_id, restaurant_id]
    );
    if (existingTab.rowCount > 0) {
      return res.status(400).json({ error: 'You already have an open tab at this restaurant' });
    }

    // Create new tab
    const result = await pool.query(
      'INSERT INTO tabs (user_id, restaurant_id) VALUES ($1, $2) RETURNING id, user_id, restaurant_id, open_time, is_open, total',
      [user_id, restaurant_id]
    );

    res.status(201).json({ tab: result.rows[0] });
  } catch (err) {
    logger.error('Create tab error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Adds a menu item to an existing tab.
 * If the item already exists in the tab, increases the quantity.
 * @param {Object} req - Express request object with params.tab_id and body.menu_item_id, body.quantity?
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends JSON response with updated tab item or error
 */
export async function addItemToTab(req, res) {
  const { tab_id } = req.params;
  const { menu_item_id, quantity = 1 } = req.body;
  const user_id = req.user.id;

  try {
    // Check if tab exists, is open, and belongs to user
    const tabCheck = await pool.query(
      'SELECT id, restaurant_id FROM tabs WHERE id = $1 AND user_id = $2 AND is_open = true',
      [tab_id, user_id]
    );
    if (tabCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Tab not found or not accessible' });
    }

    const restaurant_id = tabCheck.rows[0].restaurant_id;

    // Check if menu item exists and is available at this restaurant
    const itemCheck = await pool.query(
      'SELECT mi.id, mi.price FROM menu_items mi JOIN restaurant_menu_items rmi ON mi.id = rmi.menu_item_id WHERE mi.id = $1 AND rmi.restaurant_id = $2 AND rmi.is_available = true',
      [menu_item_id, restaurant_id]
    );
    if (itemCheck.rowCount === 0) {
      return res.status(400).json({ error: 'Menu item not available at this restaurant' });
    }

    const itemPrice = itemCheck.rows[0].price;

    // Check if item already exists in tab
    const existingItem = await pool.query(
      'SELECT id, quantity FROM tab_items WHERE tab_id = $1 AND menu_item_id = $2',
      [tab_id, menu_item_id]
    );

    let result;
    if (existingItem.rowCount > 0) {
      // Update existing item quantity
      const newQuantity = existingItem.rows[0].quantity + quantity;
      const newSubPrice = itemPrice * newQuantity;
      result = await pool.query(
        'UPDATE tab_items SET quantity = $1, sub_price = $2 WHERE id = $3 RETURNING id, tab_id, menu_item_id, quantity, sub_price',
        [newQuantity, newSubPrice, existingItem.rows[0].id]
      );
    } else {
      // Insert new tab item
      const subPrice = itemPrice * quantity;
      result = await pool.query(
        'INSERT INTO tab_items (tab_id, menu_item_id, quantity, sub_price) VALUES ($1, $2, $3, $4) RETURNING id, tab_id, menu_item_id, quantity, sub_price',
        [tab_id, menu_item_id, quantity, subPrice]
      );
    }

    res.json({ tabItem: result.rows[0] });
  } catch (err) {
    logger.error('Add item to tab error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Closes an open tab with a payment method.
 * The payment method must belong to the user.
 * @param {Object} req - Express request object with params.tab_id and body.payment_method_id
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends JSON response with closed tab or error
 */
export async function closeTab(req, res) {
  const { tab_id } = req.params;
  const { payment_method_id } = req.body;
  const user_id = req.user.id;

  try {
    // Check if tab exists, is open, and belongs to user
    const tabCheck = await pool.query(
      'SELECT id FROM tabs WHERE id = $1 AND user_id = $2 AND is_open = true',
      [tab_id, user_id]
    );
    if (tabCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Tab not found or already closed' });
    }

    // Check if payment method belongs to user
    const paymentCheck = await pool.query(
      'SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2',
      [payment_method_id, user_id]
    );
    if (paymentCheck.rowCount === 0) {
      return res.status(400).json({ error: 'Payment method not found or not accessible' });
    }

    // Calculate total from tab items
    const totalResult = await pool.query(
      'SELECT SUM(sub_price) as total FROM tab_items WHERE tab_id = $1',
      [tab_id]
    );
    const total = totalResult.rows[0].total || 0;

    // Close the tab
    const result = await pool.query(
      'UPDATE tabs SET close_time = CURRENT_TIMESTAMP, is_open = false, total = $1, payment_method_id = $2 WHERE id = $3 RETURNING id, user_id, restaurant_id, open_time, close_time, is_open, total, payment_method_id',
      [total, payment_method_id, tab_id]
    );

    res.json({ tab: result.rows[0] });
  } catch (err) {
    logger.error('Close tab error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Gets all tabs for the authenticated user.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends JSON response with array of user's tabs
 */
export async function getUserTabs(req, res) {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'SELECT id, user_id, restaurant_id, payment_method_id, open_time, close_time, is_open, total, created_at FROM tabs WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json({ tabs: result.rows });
  } catch (err) {
    logger.error('Get user tabs error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Gets a specific tab with its items.
 * @param {Object} req - Express request object with params.tab_id
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends JSON response with tab and its items or error
 */
export async function getTab(req, res) {
  const { tab_id } = req.params;
  const user_id = req.user.id;

  try {
    // Get tab info
    const tabResult = await pool.query(
      'SELECT id, user_id, restaurant_id, payment_method_id, open_time, close_time, is_open, total, created_at FROM tabs WHERE id = $1 AND user_id = $2',
      [tab_id, user_id]
    );
    if (tabResult.rowCount === 0) {
      return res.status(404).json({ error: 'Tab not found' });
    }

    // Get tab items with menu item details
    const itemsResult = await pool.query(
      'SELECT ti.id, ti.quantity, ti.sub_price, mi.name, mi.type, mi.price FROM tab_items ti JOIN menu_items mi ON ti.menu_item_id = mi.id WHERE ti.tab_id = $1 ORDER BY ti.created_at',
      [tab_id]
    );

    res.json({
      tab: tabResult.rows[0],
      items: itemsResult.rows
    });
  } catch (err) {
    logger.error('Get tab error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}