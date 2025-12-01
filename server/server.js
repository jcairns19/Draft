import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import apiRouter from './routes/api.js';
import { setupSocketIO } from './socket.js';

const app = express();
const server = createServer(app);
const io = new Server(server);
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

// Setup Socket.IO
setupSocketIO(io);

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});