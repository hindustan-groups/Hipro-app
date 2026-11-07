// Hipro Core Server Engine - PostgreSQL Synced
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS — restrict to known frontends
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://app.hindustanprojects.in',
  'https://hindustanprojects.in',
  'https://www.hindustanprojects.in',
  ...(process.env.EXTRA_CORS_ORIGINS ? process.env.EXTRA_CORS_ORIGINS.split(',') : [])
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PATCH']
  }
});

// Provide io instance to Express routes
app.set('io', io);

// Socket.io authentication middleware — verify JWT before allowing connections
const jwt = require('jsonwebtoken');
const JWT_SECRET_FOR_SOCKETS = process.env.JWT_SECRET;

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    // Only allow connection if valid guestId or public channel is explicitly requested
    const guestId = socket.handshake.auth?.guestId || socket.handshake.query?.guestId;
    if (guestId) {
      socket.user = { id: `guest_${guestId}`, role: 'GUEST', isGuest: true };
      return next();
    }
    return next(new Error('Authentication required: Bearer token or guestId must be provided'));
  }
  try {
    if (!JWT_SECRET_FOR_SOCKETS) {
      return next(new Error('Server authentication not configured'));
    }
    const decoded = jwt.verify(token, JWT_SECRET_FOR_SOCKETS);
    socket.user = {
      id: decoded.id || decoded.userId,
      role: (decoded.role || 'CUSTOMER').toUpperCase()
    };
    next();
  } catch (err) {
    next(new Error('Authentication failed: invalid token'));
  }
});

// Socket.io Real-Time Connection Handler
io.on('connection', (socket) => {
  // Join a specific thread room — sanitize input
  socket.on('join_thread', (threadId) => {
    if (threadId && typeof threadId === 'string') {
      const sanitizedId = threadId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedId) {
        socket.join(`thread_${sanitizedId}`);
      }
    }
  });

  // Leave thread room
  socket.on('leave_thread', (threadId) => {
    if (threadId && typeof threadId === 'string') {
      const sanitizedId = threadId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedId) {
        socket.leave(`thread_${sanitizedId}`);
      }
    }
  });

  // Real-Time Typing indicator
  socket.on('typing', ({ threadId, senderName, isTyping }) => {
    if (threadId && typeof threadId === 'string') {
      const sanitizedId = threadId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedId) {
        socket.to(`thread_${sanitizedId}`).emit('user_typing', { threadId: sanitizedId, senderName, isTyping });
      }
    }
  });

  // Admin: Join admin room — strictly requires authenticated admin user
  socket.on('join_admin_room', () => {
    if (socket.user && (socket.user.role === 'ADMIN' || socket.user.role === 'SUPER_ADMIN')) {
      socket.join('admin');
    } else {
      socket.emit('error', { message: 'Unauthorized: Admin access required to join admin room' });
    }
  });
});

const PORT = process.env.PORT || 5000;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files with strict security guards and anti-XSS headers
app.use('/uploads', (req, res, next) => {
  // Block executable, script, markup, and sensitive config extensions
  if (req.path.match(/\.(html|htm|xhtml|svg|js|mjs|php|phtml|jsp|asp|aspx|sh|bash|exe|bat|cmd|json|env|config|key|pem|lock|bak|sqlite)$/i)) {
    return res.status(403).json({ success: false, message: 'Direct access to this file type is forbidden' });
  }
  // Enforce security headers to prevent MIME confusion and stored XSS execution
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
  next();
});
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/v1/cities', require('./routes/cities'));
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
app.use('/api/v1/direct-bookings', require('./routes/directBookings'));
app.use('/api/v1/vendors', require('./routes/vendors'));
app.use('/api/v1/vendor-quotes', require('./routes/vendors'));
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

// Process-level crash prevention guards
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Hipro Backend API running on port ${PORT}`);
  console.log(`💬 Socket.io Real-Time Chat Engine: Active`);
  console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
  console.log(`=========================================`);
});
