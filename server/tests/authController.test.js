import { jest } from '@jest/globals';
import { signup, login, getMe, logout } from '../controllers/authController.js';

describe('Auth Controller - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should export signup function', () => {
      expect(typeof signup).toBe('function');
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = { first_name: 'John' }; // Missing other fields

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'first_name, last_name, email and password are required'
      });
    });

    it('should return 400 if fields are empty strings', async () => {
      mockReq.body = {
        first_name: '',
        last_name: '',
        email: '',
        password: ''
      };

      await signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'first_name, last_name, email and password are required'
      });
    });
  });

  describe('login', () => {
    it('should export login function', () => {
      expect(typeof login).toBe('function');
    });

    it('should return 400 if email or password is missing', async () => {
      mockReq.body = { email: 'john@example.com' }; // Missing password

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'email and password required'
      });
    });

    it('should return 400 if email or password are empty strings', async () => {
      mockReq.body = { email: '', password: '' };

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'email and password required'
      });
    });
  });

  describe('getMe', () => {
    it('should export getMe function', () => {
      expect(typeof getMe).toBe('function');
    });

    it('should return the authenticated user', () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      mockReq.user = mockUser;

      getMe(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ user: mockUser });
    });
  });

  describe('logout', () => {
    it('should export logout function', () => {
      expect(typeof logout).toBe('function');
    });

    it('should return logout success message', () => {
      logout(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Logged out successfully. Please discard your token.'
      });
    });
  });
});