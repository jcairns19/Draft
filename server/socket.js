import jwt from 'jsonwebtoken';
import pool from './database/config.js';
import logger from './logger.js';

// Store io instance for emit functions
let ioInstance = null;

/**
 * Sets up Socket.IO functionality for restaurant chat rooms
 * @param {Server} io - Socket.IO server instance
 */
export function setupSocketIO(io) {
  ioInstance = io;
  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      logger.info(`Socket auth attempt - token present: ${!!token}`);
      
      if (!token) {
        logger.error('Socket authentication failed: No token provided');
        return next(new Error('Authentication token required'));
      }

      logger.info(`Attempting to verify JWT token: ${token.substring(0, 20)}...`);
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      logger.info(`Using JWT secret: ${secret.substring(0, 10)}...`);
      
      const decoded = jwt.verify(token, secret);
      logger.info(`JWT decoded successfully:`, decoded);
      
      socket.userId = decoded.id || decoded.userId;
      socket.userEmail = decoded.email;
      logger.info(`Socket authenticated user: ${socket.userId} (${socket.userEmail})`);
      next();
    } catch (err) {
      logger.error('Socket authentication failed:', err.message);
      logger.error('Full error:', err);
      next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected`);

    // Join restaurant chat room
    socket.on('join_restaurant_chat', async (restaurantId) => {
      try {
        // Check if user can join this restaurant's chat
        const canJoin = await checkUserCanJoinChat(socket.userId, restaurantId);

        if (!canJoin) {
          socket.emit('join_error', { message: 'You do not have permission to join this chat room' });
          return;
        }

        // Leave any existing restaurant rooms
        socket.rooms.forEach(room => {
          if (room.startsWith('restaurant_')) {
            socket.leave(room);
          }
        });

        // Join the restaurant room
        const roomName = `restaurant_${restaurantId}`;
        socket.join(roomName);

        socket.emit('joined_room', { restaurantId, roomName });
        logger.info(`User ${socket.userId} joined restaurant chat ${restaurantId}`);

      } catch (err) {
        logger.error('Error joining restaurant chat:', err);
        socket.emit('join_error', { message: 'Failed to join chat room' });
      }
    });

    // Join tab updates for customers
    socket.on('join_tab_updates', async (tabId) => {
      try {
        // Verify user owns this tab
        const tabCheck = await pool.query(
          'SELECT id, restaurant_id FROM tabs WHERE id = $1 AND user_id = $2',
          [tabId, socket.userId]
        );

        if (tabCheck.rowCount === 0) {
          socket.emit('join_tab_error', { message: 'Tab not found or access denied' });
          return;
        }

        const roomName = `tab_${tabId}`;
        socket.join(roomName);
        socket.emit('joined_tab_updates', { tabId, roomName });
        logger.info(`User ${socket.userId} joined tab updates for tab ${tabId}`);

      } catch (err) {
        logger.error('Error joining tab updates:', err);
        socket.emit('join_tab_error', { message: 'Failed to join tab updates' });
      }
    });

    // Leave tab updates
    socket.on('leave_tab_updates', async (tabId) => {
      try {
        // Verify user owns this tab (optional, but good practice)
        const tabCheck = await pool.query(
          'SELECT id FROM tabs WHERE id = $1 AND user_id = $2',
          [tabId, socket.userId]
        );

        if (tabCheck.rowCount === 0) {
          // Tab not found or doesn't belong to user, but we'll still try to leave the room
          logger.warn(`User ${socket.userId} attempted to leave tab ${tabId} but doesn't own it`);
        }

        const roomName = `tab_${tabId}`;
        socket.leave(roomName);
        socket.emit('left_tab_updates', { tabId, roomName });
        logger.info(`User ${socket.userId} left tab updates for tab ${tabId}`);

      } catch (err) {
        logger.error('Error leaving tab updates:', err);
        socket.emit('leave_tab_error', { message: 'Failed to leave tab updates' });
      }
    });

    // Join manager tab updates for managers
    socket.on('join_manager_tabs', async () => {
      logger.info(`🎯 join_manager_tabs called for user: ${socket.userId}`);
      try {
        // Get all restaurants managed by this user
        logger.info(`🔍 Querying restaurants for manager_id: ${socket.userId}`);
        const restaurantsResult = await pool.query(
          'SELECT id FROM restaurants WHERE manager_id = $1',
          [socket.userId]
        );
        logger.info(`📊 Found ${restaurantsResult.rowCount} restaurants for manager ${socket.userId}`);

        if (restaurantsResult.rowCount === 0) {
          logger.warn(`⚠️ No restaurants found for manager ${socket.userId}, emitting join_manager_error`);
          socket.emit('join_manager_error', { message: 'No restaurants found for this manager' });
          return;
        }

        // Join manager room and restaurant-specific rooms
        logger.info(`🏠 Joining manager_tabs room`);
        socket.join('manager_tabs');
        restaurantsResult.rows.forEach(restaurant => {
          logger.info(`🏠 Joining restaurant_manager_${restaurant.id} room`);
          socket.join(`restaurant_manager_${restaurant.id}`);
        });

        logger.info(`✅ Manager ${socket.userId} joined manager tabs for restaurants: ${restaurantsResult.rows.map(r => r.id).join(', ')}`);
        socket.emit('joined_manager_tabs', { restaurantIds: restaurantsResult.rows.map(r => r.id) });
        logger.info(`📤 Emitted joined_manager_tabs to ${socket.userId}`);

      } catch (err) {
        logger.error('❌ Error joining manager tabs:', err);
        socket.emit('join_manager_error', { message: 'Failed to join manager tabs' });
      }
    });

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { restaurantId, message } = data;
        const roomName = `restaurant_${restaurantId}`;

        // Check if user is in the room
        if (!socket.rooms.has(roomName)) {
          socket.emit('message_error', { message: 'You are not in this chat room' });
          return;
        }

        // Get user info for the message
        const userResult = await pool.query(
          'SELECT first_name, last_name FROM users WHERE id = $1',
          [socket.userId]
        );

        if (userResult.rowCount === 0) {
          socket.emit('message_error', { message: 'User not found' });
          return;
        }

        const user = userResult.rows[0];
        const messageData = {
          userId: socket.userId,
          userName: `${user.first_name} ${user.last_name}`,
          message: message,
          timestamp: new Date().toISOString(),
          restaurantId: restaurantId
        };

        // Broadcast to room
        io.to(roomName).emit('new_message', messageData);

      } catch (err) {
        logger.error('Error sending message:', err);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    // Leave restaurant chat
    socket.on('leave_restaurant_chat', (restaurantId) => {
      const roomName = `restaurant_${restaurantId}`;
      socket.leave(roomName);
      socket.emit('left_room', { restaurantId, roomName });
      logger.info(`User ${socket.userId} left restaurant chat ${restaurantId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected`);
    });
  });
}

/**
 * Checks if a user can join a restaurant's chat room
 * @param {number} userId - User ID
 * @param {number} restaurantId - Restaurant ID
 * @returns {Promise<boolean>} Whether user can join
 */
async function checkUserCanJoinChat(userId, restaurantId) {
  try {
    // Check for open tab at restaurant
    const openTabResult = await pool.query(
      'SELECT id FROM tabs WHERE user_id = $1 AND restaurant_id = $2 AND is_open = true',
      [userId, restaurantId]
    );

    if (openTabResult.rowCount > 0) {
      return true;
    }

    // Check for closed tab within past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentClosedTabResult = await pool.query(
      'SELECT id FROM tabs WHERE user_id = $1 AND restaurant_id = $2 AND is_open = false AND close_time >= $3',
      [userId, restaurantId, sevenDaysAgo]
    );

    return recentClosedTabResult.rowCount > 0;
  } catch (err) {
    logger.error('Error checking user chat eligibility:', err);
    return false;
  }
}

export async function emitTabUpdate(tabId, restaurantId, tabData) {
  if (!ioInstance) {
    logger.error('Socket.IO not initialized');
    return;
  }

  try {
    logger.info(`🎯 Emitting tab update for tab ${tabId} at restaurant ${restaurantId}`);
    
    // Notify customers following this tab
    logger.info(`📤 Emitting to tab_${tabId} room`);
    ioInstance.to(`tab_${tabId}`).emit('tab_updated', {
      tabId,
      restaurantId,
      tab: tabData,
      timestamp: new Date().toISOString()
    });

    // Notify managers of this restaurant
    logger.info(`📤 Emitting to restaurant_manager_${restaurantId} room`);
    ioInstance.to(`restaurant_manager_${restaurantId}`).emit('manager_tab_updated', {
      tabId,
      restaurantId,
      tab: tabData,
      timestamp: new Date().toISOString()
    });

    // Also notify all managers
    logger.info(`📤 Emitting to manager_tabs room`);
    ioInstance.to('manager_tabs').emit('manager_tab_updated', {
      tabId,
      restaurantId,
      tab: tabData,
      timestamp: new Date().toISOString()
    });

    logger.info(`✅ Emitted tab update for tab ${tabId} at restaurant ${restaurantId}`);
  } catch (err) {
    logger.error('Error emitting tab update:', err);
  }
}

/**
 * Emits item served update to customer
 * @param {number} tabId - Tab ID
 * @param {number} itemId - Tab item ID that was served
 * @param {boolean} served - New served status
 */
export async function emitItemServed(tabId, itemId, served) {
  logger.info(`emitItemServed called: tabId=${tabId}, itemId=${itemId}, served=${served}, ioInstance=${!!ioInstance}`);

  if (!ioInstance) {
    logger.error('Socket.IO not initialized');
    return;
  }

  try {
    // Notify customer following this tab
    logger.info(`Emitting to room: tab_${tabId}`);
    ioInstance.to(`tab_${tabId}`).emit('item_served', {
      tabId,
      itemId,
      served,
      timestamp: new Date().toISOString()
    });

    logger.info(`Emitted item served update for item ${itemId} on tab ${tabId}`);
  } catch (err) {
    logger.error('Error emitting item served:', err);
  }
}