import 'dotenv/config';
import express from 'express';
import apiRouter from './routes/api.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static images from the images directory
app.use('/images', express.static('images'));

// Routes
app.use('/api', apiRouter);
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Draft Server API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});