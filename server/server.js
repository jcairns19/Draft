import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import apiRouter from './routes/api.js';
import { setupSocketIO } from './socket.js';
import logger from './logger.js';
import { requestLogger } from './middleware/requestLogger.js';

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow Vite dev server and production
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(requestLogger);

// Serve static images from the images directory
app.use('/images', express.static('images'));

// Routes
app.use('/api', apiRouter);
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Draft Server API' });
});

// Setup Socket.IO
setupSocketIO(io);

// Start server
server.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});