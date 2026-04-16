import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const setupSockets = (io: Server) => {
  // Middleware: Block any WebSocket attempt lacking a verified JWT Token
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication Error: Token missing'));
    
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return next(new Error('Authentication Error: Invalid token'));
      
      // Inject user profile into WS context
      socket.data.user = decoded; 
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WS] Authenticated User Connected: ${socket.data.user.username}`);

    // Mimic the STOMP Subscribe path via Socket.io Rooms
    socket.on('join_channel', (channelId: string) => {
      socket.join(`channel_${channelId}`);
      console.log(`[WS] ${socket.data.user.username} joined channel_${channelId}`);
    });

    // Mimic the STOMP /app/chat.send POST destination
    socket.on('send_message', async (data: { channelId: string; content: string }) => {
      try {
        const { channelId, content } = data;
        const userId = socket.data.user.userId;

        // Persist the message to PostgreSQL natively through Prisma!
        const message = await prisma.message.create({
          data: {
            content,
            senderId: userId,
            channelId
          },
          include: {
            sender: { select: { id: true, username: true, avatarUrl: true } }
          }
        });

        // Structure it to exactly match what the React loop is expecting
        const mappedMessage = {
          id: message.id,
          senderUsername: message.sender.username,
          content: message.content,
          createdAt: message.createdAt
        };

        // Broadcast to all users in the specific room (including sender to update UI)
        io.to(`channel_${channelId}`).emit('receive_message', mappedMessage);
      } catch (error) {
        console.error("[WS] Socket emit error persisting message:", error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Disconnected: ${socket.data.user.username}`);
    });
  });
};
