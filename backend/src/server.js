const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

// Provide io instance to Express routes
app.set('io', io);

// Socket.io Real-Time Connection Handler
io.on('connection', (socket) => {
  // Join a specific thread room
  socket.on('join_thread', (threadId) => {
    if (threadId) {
      socket.join(`thread_${threadId}`);
    }
  });

  // Leave thread room
  socket.on('leave_thread', (threadId) => {
    if (threadId) {
      socket.leave(`thread_${threadId}`);
    }
  });

  // Real-Time Typing indicator
  socket.on('typing', ({ threadId, senderName, isTyping }) => {
    if (threadId) {
      socket.to(`thread_${threadId}`).emit('user_typing', { threadId, senderName, isTyping });
    }
  });

  // Admin: Join admin room for targeted notifications
  socket.on('join_admin_room', () => {
    socket.join('admin');
  });
});

const PORT = process.env.PORT || 5000;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/v1/services', require('./routes/services'));
app.use('/api/v1/requests', require('./routes/requests'));
app.use('/api/v1/inspections', require('./routes/requests'));
app.use('/api/v1/quotations', require('./routes/quations'));
app.use('/api/v1/quations', require('./routes/quations'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/upload', require('./routes/upload'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/slides', require('./routes/slides'));
app.use('/api/v1/offers', require('./routes/offers'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/chat', require('./routes/chat'));
app.use('/api/v1/ent', require('./routes/ent'));
app.use('/api/v1/entertainment', require('./routes/ent'));
app.use('/api/v1/api/v1/ent', require('./routes/ent'));
app.use('/api/v1/direct-bookings', require('./routes/directBookings'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/partners', require('./routes/services'));
app.use('/api/v1/activity', require('./routes/activity'));

// AI Customer Support & Live Handoff System
const { initializeChatSocket } = require('./sockets/chat.socket');
initializeChatSocket(io);

app.use('/api/v1/chat/support', require('./routes/chat.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/v1/admin/support', require('./routes/admin.routes'));
app.use('/api/admin/support', require('./routes/admin.routes'));

// Root endpoint - API Status
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    message: 'Hipro API Service with Real-Time Chat',
    version: '1.2.0',
    docs: '/api/health'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    message: 'Hipro Backend API is running with Socket.io real-time chat',
    timestamp: new Date().toISOString()
  });
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Hipro Backend API running on port ${PORT}`);
  console.log(`💬 Socket.io Real-Time Chat Engine: Active`);
  console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
  console.log(`=========================================`);
});
