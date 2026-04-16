import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { authRouter } from './routes/auth';
import { guildRouter } from './routes/guilds';
import { channelRouter } from './routes/channels';
import { setupSockets } from './sockets';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Cross-Origin configuration matching the Vite setup
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Bootloaded API Sub-Routers
app.use('/api/auth', authRouter);
app.use('/api/guilds', guildRouter);
app.use('/api/channels', channelRouter);

// Main WebSocket Real-time Engine
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Pass control to the orchestrator
setupSockets(io);

// Basic check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Express server is alive!' });
});

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`[SERVER] Express Server is running on port ${PORT}`);
});
