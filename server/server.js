import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import apiRouter from './routes/api.js';
import { setupSocketIO } from './socket.js';
import logger from './logger.js';
import { requestLogger } from './middleware/requestLogger.js';

const app = express();
const server = createServer(app);

// Parse CORS origins from environment variable
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    credentials: true
  }
});
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(requestLogger);

// Serve static files from the React app build directory
const __dirname = path.dirname(new URL(import.meta.url).pathname);
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

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
const hostname = process.env.HOST || 'localhost';
server.listen(port, hostname, () => {
  logger.info(`Server running on ${hostname}:${port}`);
});