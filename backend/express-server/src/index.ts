import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Cross-Origin configuration matching the Vite setup
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Main WebSocket Real-time Engine
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Basic check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Express server is alive!' });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`[SERVER] Express Server is running on port ${PORT}`);
});
