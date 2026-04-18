import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./prisma.js";
import { redisSub } from "./redis.js";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    },
  });

  // Auth Middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
          return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      
      const user = await prisma.user.findUnique({
          where: { id: decoded.userId || decoded.id },
          select: { id: true, username: true }
      });

      if (!user) {
          return next(new Error("Authentication error: User not found"));
      }

      socket.data.userId = user.id;
      socket.data.username = user.username;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✓ User Connected: ${socket.data.username} (${socket.id})`);

    // Dynamic handlers will be attached here from the message handler file
    import("../socket/message.handler.js").then((module) => {
        module.default(io, socket);
    });

    socket.on("disconnect", () => {
      console.log(`✖ User Disconnected: ${socket.id}`);
    });
  });

  // Redis Subscriber Integration
  redisSub.psubscribe("channel:*", (err, count) => {
      if (err) console.error("Redis PSubscribe Error:", err);
  });

  redisSub.on("pmessage", (pattern, channel, message) => {
      const parsedMessage = JSON.parse(message);
      // Synchronize Redis message to the specific Socket.io room
      // channel format is "channel:{channelId}"
      io.to(channel).emit("message:new", parsedMessage);
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
