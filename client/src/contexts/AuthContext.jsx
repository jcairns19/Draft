import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

  // Configure axios defaults
  axios.defaults.baseURL = 'http://localhost:3000/api';

  // Set auth header if token exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/me');
          setUser(response.data.user);
          // Check if user is a manager
          await checkIfManager();
        } catch (error) {
          // Token is invalid, clear it
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/login', { email, password });
      const { token: newToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);

      // Check if user is a manager
      await checkIfManager();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post('/signup', userData);
      return { success: true, message: 'Account created successfully' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed'
      };
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint for logging purposes
      await axios.post('/logout');
    } catch (error) {
      // Even if backend call fails, continue with client-side logout
      console.warn('Backend logout failed, but proceeding with client-side logout:', error);
    }

    // Clear client-side state regardless of backend response
    setUser(null);
    setToken(null);
    setIsManager(false);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const checkIfManager = async () => {
    if (!token) return;
    try {
      const response = await axios.get('/restaurants/my-restaurants');
      setIsManager(response.data.isManager);
    } catch (error) {
      console.error('Error checking manager status:', error);
      setIsManager(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isManager
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};