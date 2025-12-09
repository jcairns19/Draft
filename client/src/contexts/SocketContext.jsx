import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SERVER_URL } from '../utils/config';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, user, isManager } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token && user) {
      // Create socket connection
      const newSocket = io(SERVER_URL, {
        auth: {
          token: token
        }
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        if (error.message.includes('Authentication') || error.message.includes('token')) {
          console.log('Authentication failed, disconnecting socket');
          newSocket.disconnect();
        }
      });

      // Log all incoming socket events for debugging
      newSocket.onAny((event, ...args) => {
        console.log(`🔌 SOCKET EVENT RECEIVED: ${event}`, args);
      });

      // Log all outgoing socket events for debugging
      const originalEmit = newSocket.emit;
      newSocket.emit = function(...args) {
        console.log(`📤 SOCKET EVENT SENT: ${args[0]}`, args.slice(1));
        return originalEmit.apply(this, args);
      };

      // Handle authentication errors
      newSocket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');
        // Join appropriate rooms based on user type
        if (isManager) {
          console.log('👨‍💼 User is manager, emitting join_manager_tabs');
          newSocket.emit('join_manager_tabs');
        } else {
          console.log('👤 User is not manager, skipping join_manager_tabs');
        }
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [token, user, isManager]);

  // Method to join tab updates for customers
  const joinTabUpdates = (tabId) => {
    if (socket) {
      socket.emit('join_tab_updates', tabId);
    }
  };

  // Method to leave tab updates
  const leaveTabUpdates = (tabId) => {
    if (socket) {
      socket.emit('leave_tab_updates', tabId);
    }
  };

  const value = {
    socket,
    joinTabUpdates,
    leaveTabUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};