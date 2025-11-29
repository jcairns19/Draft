import express from 'express';
import auth from '../middleware/auth.js';
import { signup, login, getMe, logout } from '../controllers/authController.js';
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '../controllers/paymentController.js';

const router = express.Router();

// Basic health
router.get('/', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

router.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Auth routes
// Signup: create a new user
// Expected body: { first_name, last_name, email, password, profile_picture_url? }
router.post('/signup', signup);

// Login: returns a bearer token
// Expected body: { email, password }
router.post('/login', login);

// Protected route example: get current user
router.get('/me', auth.authenticateToken, getMe);

// Logout: invalidate session (client discards token)
router.post('/logout', auth.authenticateToken, logout);

// Payment method routes (protected)
// Get payment method(s) for the user
router.get('/payment-methods', auth.authenticateToken, getPaymentMethods);

// Create or replace payment method
router.post('/payment-methods', auth.authenticateToken, createPaymentMethod);

// Update existing payment method
router.put('/payment-methods/:id', auth.authenticateToken, updatePaymentMethod);

// Delete payment method
router.delete('/payment-methods/:id', auth.authenticateToken, deletePaymentMethod);

export default router;