const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

/**
 * Socket.IO Real-Time Chat & Support Handoff Handler
 */
function initializeChatSocket(io) {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        // Allow unauthenticated connection for legacy/public listeners if needed
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id || decoded.userId;

      if (!userId) {
        return next(new Error('Invalid socket authentication token payload'));
      }

      // Check if user is an agent
      const agent = await prisma.supportAgent.findUnique({
        where: { userId }
      });

      socket.user = {
        id: userId,
        role: agent?.isActive ? 'AGENT' : (decoded.role || 'CUSTOMER'),
        agentId: agent?.id || null
      };

      next();
    } catch (err) {
      console.warn('[Socket Auth Warning]:', err.message);
      // Still allow connection as guest/observer
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id || 'guest';
    const userRole = socket.user?.role || 'GUEST';

    // Auto-join agents room for live escalation alerts
    if (['AGENT', 'ADMIN'].includes(userRole)) {
      socket.join('support:agents');
    }

    // Join conversation room with authorization check
    socket.on('conversation:join', async (conversationId, callback) => {
      try {
        if (!conversationId || typeof conversationId !== 'string') {
          return callback && callback({ success: false, message: 'Invalid conversation ID' });
        }

        // If authenticated, check access rights
        if (socket.user) {
          const conversation = await prisma.supportConversation.findUnique({
            where: { id: conversationId },
            include: { assignedAgent: true }
          });

          if (!conversation) {
            return callback && callback({ success: false, message: 'Conversation not found' });
          }

          const isOwner = conversation.customerId === socket.user.id;
          const isAssigned = conversation.assignedAgent?.userId === socket.user.id;
          const isStaff = ['AGENT', 'ADMIN'].includes(socket.user.role);

          if (!isOwner && !isAssigned && !isStaff) {
            return callback && callback({ success: false, message: 'Access denied to this conversation' });
          }
        }

        socket.join(`conversation:${conversationId}`);
        if (callback) callback({ success: true, conversationId });
      } catch (err) {
        console.error('Error joining conversation room:', err);
        if (callback) callback({ success: false, message: 'Error joining conversation room' });
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Live typing indicator
    socket.on('conversation:typing', ({ conversationId, isTyping, senderName }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('conversation:typing', {
          conversationId,
          isTyping,
          senderName: senderName || (socket.user ? 'Support' : 'Customer')
        });
      }
    });

    // Legacy thread join backward-compatibility
    socket.on('join_thread', (threadId) => {
      if (threadId) {
        socket.join(`thread_${threadId}`);
      }
    });

    socket.on('leave_thread', (threadId) => {
      if (threadId) {
        socket.leave(`thread_${threadId}`);
      }
    });

    socket.on('join_admin_room', () => {
      socket.join('admin');
      socket.join('support:agents');
    });

    socket.on('disconnect', () => {
      // Cleanup if needed
    });
  });
}

module.exports = { initializeChatSocket };

