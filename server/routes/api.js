import express from 'express';

const router = express.Router();

// Example API route
router.get('/', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

router.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

export default router;