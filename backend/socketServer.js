import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import ChatMessage from './models/ChatMessage.js';
import ChatRoom from './models/ChatRoom.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join announcement room for real-time updates
    socket.join('announcements');

    // Join chat room
    socket.on('join-room', async (roomId) => {
      try {
        // Verify user has access to this room
        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
          socket.emit('error', { message: 'Chat room not found' });
          return;
        }

        if (chatRoom.doctor.toString() !== socket.userId && 
            chatRoom.student.toString() !== socket.userId) {
          socket.emit('error', { message: 'Not authorized to join this room' });
          return;
        }

        socket.join(`room:${roomId}`);
        socket.emit('joined-room', { roomId });

        // Notify other user in the room
        socket.to(`room:${roomId}`).emit('user-joined', {
          userId: socket.userId,
          userName: socket.userName
        });
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Error joining room' });
      }
    });

    // Leave chat room
    socket.on('leave-room', (roomId) => {
      socket.leave(`room:${roomId}`);
      socket.emit('left-room', { roomId });
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { roomId, message } = data;

        if (!message || !message.trim()) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Verify user has access to this room
        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
          socket.emit('error', { message: 'Chat room not found' });
          return;
        }

        if (chatRoom.doctor.toString() !== socket.userId && 
            chatRoom.student.toString() !== socket.userId) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Create message
        const chatMessage = new ChatMessage({
          chatRoom: roomId,
          sender: socket.userId,
          senderRole: socket.userRole,
          message: message.trim(),
          messageType: 'text'
        });

        await chatMessage.save();

        // Populate sender info
        const populatedMessage = await ChatMessage.findById(chatMessage._id)
          .populate('sender', 'name');

        // Broadcast to all users in the room
        io.to(`room:${roomId}`).emit('new-message', populatedMessage);

        // Also notify user in their personal room for badge updates
        const otherUserId = chatRoom.doctor.toString() === socket.userId 
          ? chatRoom.student.toString()
          : chatRoom.doctor.toString();
        
        io.to(`user:${otherUserId}`).emit('message-received', {
          roomId,
          message: populatedMessage
        });

        // Update chat room timestamp
        await ChatRoom.findByIdAndUpdate(roomId, { updatedAt: new Date() });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { roomId } = data;
      socket.to(`room:${roomId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName,
        roomId
      });
    });

    socket.on('stop-typing', (data) => {
      const { roomId } = data;
      socket.to(`room:${roomId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        roomId
      });
    });

    // Announcement updates
    socket.on('announcement-created', (announcement) => {
      io.to('announcements').emit('new-announcement', announcement);
    });

    socket.on('announcement-updated', (announcement) => {
      io.to('announcements').emit('announcement-status-changed', announcement);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
