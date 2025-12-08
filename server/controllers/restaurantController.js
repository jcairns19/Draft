import models from '../database/models/index.js';
import logger from '../logger.js';

/**
 * Retrieves all restaurants.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with array of restaurants.
 */
export async function getAllRestaurants(req, res) {
  try {
    const restaurants = await models.Restaurant.findAll({
      attributes: ['id', 'name', 'slogan', 'address', 'open_time', 'close_time', 'image_url', 'manager_id', 'created_at'],
      order: [['name', 'ASC']]
    });
    res.json({ restaurants });
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
    const restaurant = await models.Restaurant.findByPk(id, {
      attributes: ['id', 'name', 'slogan', 'address', 'image_url', 'open_time', 'close_time', 'manager_id', 'created_at']
    });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json({ restaurant });
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
    const restaurant = await models.Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const menuItems = await models.RestaurantMenuItem.findAll({
      where: { restaurant_id: id },
      include: [{
        model: models.MenuItem,
        attributes: ['id', 'type', 'name', 'abv', 'description', 'image_url', 'price', 'created_at']
      }],
      order: [[models.MenuItem, 'type', 'ASC'], [models.MenuItem, 'name', 'ASC']]
    });

    // Format the response to match the original structure
    const formattedMenuItems = menuItems.map(item => {
      const menuItem = item.MenuItem.toJSON();
      return {
        ...menuItem,
        price: parseFloat(menuItem.price),
        abv: menuItem.abv ? parseFloat(menuItem.abv) : null
      };
    });

    res.json({ menuItems: formattedMenuItems });
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
    const restaurantCount = await models.Restaurant.count({
      where: { manager_id }
    });
    const isManager = restaurantCount > 0;
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
    const restaurants = await models.Restaurant.findAll({
      where: { manager_id },
      attributes: ['id', 'name']
    });

    // Get all open tabs for these restaurants
    const restaurantsWithTabs = await Promise.all(
      restaurants.map(async (restaurant) => {
        const tabs = await models.Tab.findAll({
          where: { restaurant_id: restaurant.id, is_open: true },
          attributes: ['id', 'user_id', 'restaurant_id', 'is_open', 'created_at'],
          order: [['created_at', 'ASC']],
          include: [{
            model: models.TabItem,
            include: [{
              model: models.MenuItem,
              attributes: ['name']
            }],
            attributes: ['id', 'quantity', 'sub_price', 'served', 'created_at'],
            order: [['created_at', 'ASC']]
          }]
        });

        // Format tabs with items
        const tabsWithItems = tabs.map(tab => ({
          id: tab.id,
          user_id: tab.user_id,
          restaurant_id: tab.restaurant_id,
          is_open: tab.is_open,
          created_at: tab.created_at,
          restaurant_name: restaurant.name,
          tab_items: tab.TabItems.map(item => ({
            id: item.id,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.sub_price),
            served: Boolean(item.served),
            menu_item: { name: item.MenuItem.name }
          }))
        }));

        return {
          id: restaurant.id,
          name: restaurant.name,
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
    const restaurant = await models.Restaurant.findOne({
      where: { id, manager_id }
    });
    if (!restaurant) {
      return res.status(403).json({ error: 'Access denied. You are not the manager of this restaurant.' });
    }

    // Get all open tabs with their items
    const tabs = await models.Tab.findAll({
      where: { restaurant_id: id, is_open: true },
      attributes: ['id', 'user_id', 'restaurant_id', 'open_time', 'is_open', 'total'],
      order: [['open_time', 'ASC']],
      include: [{
        model: models.TabItem,
        include: [{
          model: models.MenuItem,
          attributes: ['name', 'type']
        }],
        attributes: ['id', 'quantity', 'sub_price', 'served', 'created_at'],
        order: [['created_at', 'ASC']]
      }]
    });

    // Format the response
    const tabsWithItems = tabs.map(tab => ({
      id: tab.id,
      user_id: tab.user_id,
      restaurant_id: tab.restaurant_id,
      open_time: tab.open_time,
      is_open: tab.is_open,
      total: parseFloat(tab.total),
      items: tab.TabItems.map(item => ({
        id: item.id,
        quantity: parseInt(item.quantity),
        sub_price: parseFloat(item.sub_price),
        served: Boolean(item.served),
        name: item.MenuItem.name,
        type: item.MenuItem.type
      }))
    }));

    res.json({ tabs: tabsWithItems });
  } catch (err) {
    logger.error('Get open tabs for restaurant error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}