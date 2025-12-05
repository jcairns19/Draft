import express from 'express';
import auth from '../middleware/auth.js';
import { signup, login, getMe, logout } from '../controllers/authController.js';
import { getPaymentMethods, createPaymentMethod, deletePaymentMethod } from '../controllers/paymentController.js';
import { getAllRestaurants, getRestaurantById, getMenu, getOpenTabsForRestaurant, getManagerTabs, checkManagerStatus } from '../controllers/restaurantController.js';
import { createTab, addItemToTab, closeTab, getUserTabs, getTab, updateTabItemServed } from '../controllers/tabsController.js';

const router = express.Router();

// Basic health
router.get('/', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

router.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// ---------- Auth routes ----------
router.post('/signup', signup); // Signup: create a new user, Expected body: { first_name, last_name, email, password, profile_picture_url? }
router.post('/login', login); // Login: returns a bearer token, Expected body: { email, password }
router.get('/me', auth.authenticateToken, getMe); // Protected route example: get current user
router.post('/logout', auth.authenticateToken, logout); // Logout: invalidate session (client discards token)

// ---------- Payment method routes (protected) ----------
router.get('/payment-methods', auth.authenticateToken, getPaymentMethods); // Get payment method(s) for the user
router.post('/payment-methods', auth.authenticateToken, createPaymentMethod); // Create or replace payment method
router.delete('/payment-methods/:id', auth.authenticateToken, deletePaymentMethod); // Delete payment method

// ---------- Restaurant routes (public - no auth required for viewing) ----------
router.get('/restaurants', getAllRestaurants); // Get all restaurants
router.get('/restaurants/my-restaurants', auth.authenticateToken, checkManagerStatus); // Check if user is a manager
router.get('/restaurants/manager/tabs', auth.authenticateToken, getManagerTabs); // Get all open tabs for manager's restaurants
router.get('/restaurants/:id', getRestaurantById); // Get single restaurant by ID
router.get('/restaurants/:id/menu', getMenu); // Get menu for a restaurant
router.get('/restaurants/:id/open-tabs', auth.authenticateToken, getOpenTabsForRestaurant); // Get open tabs for restaurant (managers only)

// ---------- Tab routes (protected - require authentication) ----------
router.get('/tabs', auth.authenticateToken, getUserTabs); // Get all tabs for the user
router.get('/tabs/:tab_id', auth.authenticateToken, getTab); // Get a specific tab with items
router.post('/tabs', auth.authenticateToken, createTab); // Create a new tab
router.post('/tabs/:tab_id/items', auth.authenticateToken, addItemToTab); // Add item to tab
router.patch('/tabs/:tab_id/items/:item_id/served', auth.authenticateToken, updateTabItemServed); // Update served status of tab item
router.put('/tabs/:tab_id/close', auth.authenticateToken, closeTab); // Close tab 

export default router;