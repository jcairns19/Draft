import jwt from 'jsonwebtoken';
import pool from './database/config.js';

/**
 * Sets up Socket.IO functionality for restaurant chat rooms
 * @param {Server} io - Socket.IO server instance
 */
export function setupSocketIO(io) {
  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

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
        console.log(`User ${socket.userId} joined restaurant chat ${restaurantId}`);

      } catch (err) {
        console.error('Error joining restaurant chat:', err);
        socket.emit('join_error', { message: 'Failed to join chat room' });
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
        console.error('Error sending message:', err);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    // Leave restaurant chat
    socket.on('leave_restaurant_chat', (restaurantId) => {
      const roomName = `restaurant_${restaurantId}`;
      socket.leave(roomName);
      socket.emit('left_room', { restaurantId, roomName });
      console.log(`User ${socket.userId} left restaurant chat ${restaurantId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
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
    console.error('Error checking user chat eligibility:', err);
    return false;
  }
}