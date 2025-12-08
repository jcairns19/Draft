import { jest } from '@jest/globals';
import { getPaymentMethods, createPaymentMethod, deletePaymentMethod } from '../controllers/paymentController.js';

describe('Payment Controller - Unit Tests', () => {
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

  describe('getPaymentMethods', () => {
    it('should export getPaymentMethods function', () => {
      expect(typeof getPaymentMethods).toBe('function');
    });
  });

  describe('createPaymentMethod', () => {
    it('should export createPaymentMethod function', () => {
      expect(typeof createPaymentMethod).toBe('function');
    });

    it('should return 400 if card_number or card_cvc are missing', async () => {
      mockReq.body = { card_number: '1234567890123456' }; // Missing card_cvc

      await createPaymentMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'card_number and card_cvc are required'
      });
    });

    it('should return 400 if card_number or card_cvc are empty strings', async () => {
      mockReq.body = { card_number: '', card_cvc: '' };

      await createPaymentMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'card_number and card_cvc are required'
      });
    });
  });

  describe('deletePaymentMethod', () => {
    it('should export deletePaymentMethod function', () => {
      expect(typeof deletePaymentMethod).toBe('function');
    });
  });
});