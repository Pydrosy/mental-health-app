// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const therapistRoutes = require('./routes/therapist.routes');
const sessionRoutes = require('./routes/session.routes');
const messageRoutes = require('./routes/message.routes');
const matchingRoutes = require('./routes/matching.routes');
const uploadRoutes = require('./routes/upload.routes');

// Import middleware
const { errorHandler } = require('./middleware/error.middleware');
const { socketAuth } = require('./middleware/auth.middleware');

const app = express();
const server = http.createServer(app);

// Get environment variables with defaults
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mental-health';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

console.log('📊 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT,
  MONGODB_URI: MONGODB_URI.replace(/:[^:]*@/, '://****:****@'), // Hide password
  FRONTEND_URL
});

// Socket.io setup
const io = socketIO(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', limiter);

// Static files
app.use('/uploads', express.static('uploads'));

// ================ FIXED DATABASE CONNECTION ================
// Removed deprecated options (useNewUrlParser and useUnifiedTopology are no longer needed)
mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
// ============================================================

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Mental Health API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route not found: ${req.method} ${req.originalUrl}` 
  });
});

// Socket.io connection handling
io.use(socketAuth);

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.userId);

  // Join user's personal room
  socket.join(`user:${socket.userId}`);

  socket.on('join-chat', ({ recipientId }) => {
    const roomId = [socket.userId, recipientId].sort().join('-');
    socket.join(`chat:${roomId}`);
    console.log(`User ${socket.userId} joined chat room: ${roomId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      const { recipientId, content, messageType = 'text' } = data;
      
      // Save message to database
      const Message = require('./models/message.model');
      const message = new Message({
        sender: socket.userId,
        recipient: recipientId,
        content,
        messageType
      });
      await message.save();

      // Populate sender info
      await message.populate('sender', 'profile.firstName profile.lastName profile.profilePicture');

      // Emit to recipient
      io.to(`user:${recipientId}`).emit('new-message', message);

      // Emit to sender for confirmation
      socket.emit('message-sent', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  socket.on('typing', ({ recipientId, isTyping }) => {
    socket.to(`user:${recipientId}`).emit('user-typing', {
      userId: socket.userId,
      isTyping
    });
  });

  socket.on('mark-read', async ({ messageIds }) => {
    try {
      const Message = require('./models/message.model');
      await Message.updateMany(
        { _id: { $in: messageIds }, recipient: socket.userId },
        { read: true, readAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.userId);
  });
});

// Error handling middleware
app.use(errorHandler);

// ================ FIXED SERVER LISTEN ================
// Bind to 0.0.0.0 to accept connections from outside the container
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Server is running on port ${PORT}
  📝 Environment: ${process.env.NODE_ENV || 'development'}
  🔗 Frontend URL: ${FRONTEND_URL}
  `);
});
// =====================================================