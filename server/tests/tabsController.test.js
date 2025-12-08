import { jest } from '@jest/globals';
import { createTab, addItemToTab, closeTab, getUserTabs, getTab, updateTabItemServed } from '../controllers/tabsController.js';

describe('Tabs Controller - Unit Tests', () => {
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

  describe('createTab', () => {
    it('should export createTab function', () => {
      expect(typeof createTab).toBe('function');
    });

    it('should return 404 if restaurant_id is missing', async () => {
      mockReq.body = {}; // Missing restaurant_id

      await createTab(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Restaurant not found'
      });
    });
  });

  describe('addItemToTab', () => {
    it('should export addItemToTab function', () => {
      expect(typeof addItemToTab).toBe('function');
    });

    it('should handle missing tab_id parameter', async () => {
      mockReq.params = {}; // No tab_id parameter
      mockReq.body = { menu_item_id: 1 };

      await addItemToTab(mockReq, mockRes);

      // Should return 500 when database query fails due to undefined tab_id
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('closeTab', () => {
    it('should export closeTab function', () => {
      expect(typeof closeTab).toBe('function');
    });
  });

  describe('getUserTabs', () => {
    it('should export getUserTabs function', () => {
      expect(typeof getUserTabs).toBe('function');
    });
  });

  describe('getTab', () => {
    it('should export getTab function', () => {
      expect(typeof getTab).toBe('function');
    });
  });

  describe('updateTabItemServed', () => {
    it('should export updateTabItemServed function', () => {
      expect(typeof updateTabItemServed).toBe('function');
    });
  });
});