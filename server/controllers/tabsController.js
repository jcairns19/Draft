import models from '../database/models/index.js';
import logger from '../logger.js';
import { emitTabUpdate, emitItemServed } from '../socket.js';

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
    const restaurant = await models.Restaurant.findByPk(restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check if user already has an open tab at this restaurant
    const existingTab = await models.Tab.findOne({
      where: {
        user_id: user_id,
        restaurant_id: restaurant_id,
        is_open: true
      }
    });
    if (existingTab) {
      return res.status(400).json({ error: 'You already have an open tab at this restaurant' });
    }

    // Create new tab
    const newTab = await models.Tab.create({
      user_id: user_id,
      restaurant_id: restaurant_id
    });

    // Emit tab update event
    await emitTabUpdate(newTab.id, restaurant_id, newTab);

    res.status(201).json({ tab: newTab });
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
    const tab = await models.Tab.findOne({
      where: {
        id: tab_id,
        user_id: user_id,
        is_open: true
      }
    });
    if (!tab) {
      return res.status(404).json({ error: 'Tab not found or not accessible' });
    }

    const restaurant_id = tab.restaurant_id;

    // Check if menu item exists and is available at this restaurant
    const menuItem = await models.MenuItem.findOne({
      include: [{
        model: models.RestaurantMenuItem,
        where: {
          restaurant_id: restaurant_id,
          is_available: true
        },
        required: true
      }],
      where: { id: menu_item_id }
    });
    if (!menuItem) {
      return res.status(400).json({ error: 'Menu item not available at this restaurant' });
    }

    const itemPrice = parseFloat(menuItem.price);

    // Check if item already exists in tab
    const existingItem = await models.TabItem.findOne({
      where: {
        tab_id: tab_id,
        menu_item_id: menu_item_id
      }
    });

    let result;
    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + quantity;
      const newSubPrice = itemPrice * newQuantity;
      result = await existingItem.update({
        quantity: newQuantity,
        sub_price: newSubPrice
      });
    } else {
      // Insert new tab item
      const subPrice = itemPrice * quantity;
      result = await models.TabItem.create({
        tab_id: tab_id,
        menu_item_id: menu_item_id,
        quantity: quantity,
        sub_price: subPrice
      });
    }

    // Recalculate the total based on all tab items
    const totalResult = await models.TabItem.sum('sub_price', {
      where: { tab_id: tab_id }
    });
    const newTotal = parseFloat(totalResult || 0);

    // Update the tab total
    await tab.update({ total: newTotal });

    // Emit tab update event
    await emitTabUpdate(tab_id, restaurant_id, tab);

    res.json({ tabItem: result });
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
    const tab = await models.Tab.findOne({
      where: {
        id: tab_id,
        user_id: user_id,
        is_open: true
      }
    });
    if (!tab) {
      return res.status(404).json({ error: 'Tab not found or already closed' });
    }

    // Check if payment method belongs to user
    const paymentMethod = await models.PaymentMethod.findOne({
      where: {
        id: payment_method_id,
        user_id: user_id
      }
    });
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method not found or not accessible' });
    }

    // Calculate total from tab items
    const total = await models.TabItem.sum('sub_price', {
      where: { tab_id: tab_id }
    }) || 0;

    // Close the tab
    const closedTab = await tab.update({
      close_time: new Date(),
      is_open: false,
      total: total,
      payment_method_id: payment_method_id
    });

    // Emit tab update event to notify managers
    await emitTabUpdate(tab_id, closedTab.restaurant_id, closedTab);

    res.json({ tab: closedTab });
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
    // Get all tabs for the user with their items to calculate totals
    const tabs = await models.Tab.findAll({
      where: { user_id: user_id },
      include: [{
        model: models.TabItem,
        attributes: ['sub_price']
      }],
      order: [['created_at', 'DESC']]
    });

    // Calculate total for each tab from its items
    const tabsWithTotals = tabs.map(tab => {
      const calculatedTotal = tab.TabItems.reduce((sum, item) => sum + parseFloat(item.sub_price), 0);
      const tabData = tab.toJSON();
      delete tabData.TabItems; // Remove the included items from response
      return {
        ...tabData,
        total: calculatedTotal
      };
    });

    res.json({ tabs: tabsWithTotals });
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
    // Get tab info with restaurant name and tab items
    const tab = await models.Tab.findOne({
      where: {
        id: tab_id,
        user_id: user_id
      },
      include: [
        {
          model: models.Restaurant,
          attributes: ['name']
        },
        {
          model: models.TabItem,
          include: [{
            model: models.MenuItem,
            attributes: ['name', 'type', 'price']
          }],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!tab) {
      return res.status(404).json({ error: 'Tab not found' });
    }

    // Parse numeric fields and calculate total
    const items = tab.TabItems.map(item => ({
      id: item.id,
      quantity: parseInt(item.quantity),
      sub_price: parseFloat(item.sub_price),
      served: Boolean(item.served),
      name: item.MenuItem.name,
      type: item.MenuItem.type,
      price: parseFloat(item.MenuItem.price)
    }));

    // Calculate total from tab items
    const calculatedTotal = items.reduce((sum, item) => sum + item.sub_price, 0);

    // Prepare tab data
    const tabData = {
      id: tab.id,
      user_id: tab.user_id,
      restaurant_id: tab.restaurant_id,
      payment_method_id: tab.payment_method_id,
      open_time: tab.open_time,
      close_time: tab.close_time,
      is_open: tab.is_open,
      total: calculatedTotal,
      created_at: tab.created_at,
      restaurant_name: tab.Restaurant.name
    };

    res.json({
      tab: tabData,
      items: items
    });
  } catch (err) {
    logger.error('Get tab error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Updates the served status of a tab item.
 * @param {Object} req - Express request object with params.tab_item_id and body.served
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends JSON response with updated tab item or error
 */
export async function updateTabItemServed(req, res) {
  const { tab_id, item_id } = req.params;
  const { served } = req.body;
  const user_id = req.user.id;

  try {
    // First verify the user is the manager of the restaurant that this tab belongs to
    const tabItem = await models.TabItem.findOne({
      where: { id: item_id, tab_id: tab_id },
      include: [{
        model: models.Tab,
        include: [{
          model: models.Restaurant,
          where: { manager_id: user_id },
          required: true
        }],
        required: true
      }],
      required: true
    });

    if (!tabItem) {
      return res.status(403).json({ error: 'Access denied. Only restaurant managers can update served status.' });
    }

    // Update the served status
    const updatedItem = await tabItem.update({ served: served });

    const restaurantId = tabItem.Tab.restaurant_id;

    // Get updated tab data
    const updatedTab = await models.Tab.findByPk(tab_id, {
      attributes: ['id', 'user_id', 'restaurant_id', 'open_time', 'is_open', 'total']
    });

    // Emit item served event to customer
    console.log(`Emitting item served event: tabId=${tab_id}, itemId=${item_id}, served=${served}`);
    await emitItemServed(tab_id, item_id, served);

    // Emit tab update event to managers
    await emitTabUpdate(tab_id, restaurantId, updatedTab);

    res.json({ tabItem: updatedItem });
  } catch (err) {
    logger.error('Update tab item served error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}