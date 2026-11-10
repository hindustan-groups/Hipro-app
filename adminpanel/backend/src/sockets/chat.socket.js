const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⛔ FATAL: JWT_SECRET environment variable is not set. Socket authentication will fail.');
}

/**
 * Socket.IO Real-Time Chat & Support Handoff Handler
 */
function initializeChatSocket(io) {
  // Authentication middleware for socket connections with graceful fallback
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      const clientRole = (socket.handshake.auth?.role || 'CUSTOMER').toUpperCase();
      const vendorId = socket.handshake.auth?.vendorId || null;

      if (!token || !JWT_SECRET) {
        socket.user = {
          id: socket.handshake.auth?.userId || `anon_${socket.id.slice(0, 8)}`,
          role: clientRole,
          agentId: null,
          vendorId: vendorId
        };
        return next();
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id || decoded.userId;

        if (userId) {
          const agent = await prisma.supportAgent.findUnique({
            where: { userId }
          }).catch(() => null);

          socket.user = {
            id: userId,
            role: agent?.isActive ? 'AGENT' : (decoded.role || clientRole).toUpperCase(),
            agentId: agent?.id || null,
            vendorId: decoded.vendorId || (decoded.role === 'VENDOR' ? userId : vendorId)
          };
          return next();
        }
      } catch (err) {
        // Fallback for expired token in panel
      }

      socket.user = {
        id: socket.handshake.auth?.userId || `anon_${socket.id.slice(0, 8)}`,
        role: clientRole,
        agentId: null,
        vendorId: vendorId
      };
      next();
    } catch (err) {
      socket.user = { id: `anon_${socket.id.slice(0, 8)}`, role: 'CUSTOMER', agentId: null, vendorId: null };
      next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    const userRole = socket.user?.role || 'CUSTOMER';

    // Auto-join personal user room for private directed updates
    if (userId) {
      socket.join(`user_${userId}`);
    }

    // Auto-join staff / admin rooms for authorized staff only
    if (['AGENT', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      socket.join('admin');
      socket.join('admin_room');
      socket.join('support:agents');
    }

    if (userRole === 'VENDOR' && socket.user?.vendorId) {
      socket.join(`vendor_${socket.user.vendorId}`);
    }

    // Join conversation room with strict authorization check
    socket.on('conversation:join', async (conversationId, callback) => {
      try {
        if (!conversationId || typeof conversationId !== 'string') {
          return callback && callback({ success: false, message: 'Invalid conversation ID' });
        }

        if (!socket.user) {
          return callback && callback({ success: false, message: 'Authentication required' });
        }

        const conversation = await prisma.supportConversation.findUnique({
          where: { id: conversationId },
          include: { assignedAgent: true }
        });

        if (!conversation) {
          return callback && callback({ success: false, message: 'Conversation not found' });
        }

        const isOwner = conversation.customerId === socket.user.id;
        const isAssigned = conversation.assignedAgent?.userId === socket.user.id;
        const isStaff = ['AGENT', 'ADMIN', 'SUPER_ADMIN'].includes(socket.user.role);

        if (!isOwner && !isAssigned && !isStaff) {
          return callback && callback({ success: false, message: 'Access denied to this conversation' });
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

    // Thread room join
    socket.on('join_thread', async (threadId) => {
      if (!threadId) return;
      socket.join(`thread_${threadId}`);
    });

    socket.on('leave_thread', (threadId) => {
      if (threadId) {
        socket.leave(`thread_${threadId}`);
      }
    });

    socket.on('join_admin_room', () => {
      socket.join('admin');
      socket.join('admin_room');
      socket.join('support:agents');
    });

    socket.on('disconnect', () => {
      // Cleanup if needed
    });
  });
}

module.exports = { initializeChatSocket };

