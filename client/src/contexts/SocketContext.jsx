import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

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
  const socketRef = useRef(null);

  useEffect(() => {
    if (token && user) {
      // Create socket connection
      socketRef.current = io('http://localhost:3000', {
        auth: {
          token: token
        }
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      // Log all events for debugging
      socket.onAny((event, ...args) => {
        console.log('Socket event received:', event, args);
      });

      // Join appropriate rooms based on user type
      if (isManager) {
        socket.emit('join_manager_tabs');
      }

      return () => {
        socket.disconnect();
      };
    } else if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [token, user, isManager]);

  // Method to join tab updates for customers
  const joinTabUpdates = (tabId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_tab_updates', tabId);
    }
  };

  // Method to leave tab updates
  const leaveTabUpdates = (tabId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_tab_updates', tabId);
    }
  };

  const value = {
    socket: socketRef.current,
    joinTabUpdates,
    leaveTabUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};