import { jest } from '@jest/globals';
import { getAllRestaurants, getRestaurantById, getMenu, checkManagerStatus, getManagerTabs, getOpenTabsForRestaurant } from '../controllers/restaurantController.js';

describe('Restaurant Controller - Unit Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      user: { id: 1 }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getAllRestaurants', () => {
    it('should export getAllRestaurants function', () => {
      expect(typeof getAllRestaurants).toBe('function');
    });
  });

  describe('getRestaurantById', () => {
    it('should export getRestaurantById function', () => {
      expect(typeof getRestaurantById).toBe('function');
    });

    it('should handle missing id parameter', async () => {
      mockReq.params = {}; // No id parameter

      await getRestaurantById(mockReq, mockRes);

      // When id is undefined, Sequelize findByPk returns null, causing 404
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getMenu', () => {
    it('should export getMenu function', () => {
      expect(typeof getMenu).toBe('function');
    });
  });

  describe('checkManagerStatus', () => {
    it('should export checkManagerStatus function', () => {
      expect(typeof checkManagerStatus).toBe('function');
    });
  });

  describe('getManagerTabs', () => {
    it('should export getManagerTabs function', () => {
      expect(typeof getManagerTabs).toBe('function');
    });
  });

  describe('getOpenTabsForRestaurant', () => {
    it('should export getOpenTabsForRestaurant function', () => {
      expect(typeof getOpenTabsForRestaurant).toBe('function');
    });
  });
});