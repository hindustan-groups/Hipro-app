const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma');
const {
  createConversation,
  sendMessage,
  getConversationMessages,
  getCustomerConversations,
  customerHandoff,
  resetToAi
} = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

// Brute-force / spam protection for chat messages (60 messages per minute per IP)
const chatMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many chat messages. Please wait a moment before sending more.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Database-backed AI Chatbot & Customer Support Routes
router.post('/conversations', authenticate, createConversation);
router.get('/conversations', authenticate, getCustomerConversations);
router.get('/conversations/:id/messages', authenticate, getConversationMessages);
router.post('/message', authenticate, chatMessageLimiter, sendMessage);
router.post('/conversations/:id/handoff', authenticate, customerHandoff);
router.post('/conversations/:id/reset-ai', authenticate, resetToAi);

// Move chat storage outside publicly accessible /uploads folder to protected data folder
const DATA_DIR = path.join(__dirname, '../data');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
const OLD_CHATS_FILE = path.join(__dirname, '../../uploads/chats.json');

// Auto-migrate from public uploads folder if exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(OLD_CHATS_FILE) && !fs.existsSync(CHATS_FILE)) {
    fs.copyFileSync(OLD_CHATS_FILE, CHATS_FILE);
    fs.unlinkSync(OLD_CHATS_FILE);
    console.log('✅ Migrated chats.json from uploads to secure data directory');
  }
} catch (migErr) {
  console.warn('Chat data directory check warning:', migErr.message);
}

// Default initial chat thread
const DEFAULT_CHATS = {
  threads: [],
  messages: []
};

function readChatData() {
  try {
    if (!fs.existsSync(CHATS_FILE)) {
      fs.mkdirSync(path.dirname(CHATS_FILE), { recursive: true });
      fs.writeFileSync(CHATS_FILE, JSON.stringify(DEFAULT_CHATS, null, 2), 'utf-8');
      return DEFAULT_CHATS;
    }
    const data = fs.readFileSync(CHATS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading chats file:', err);
    return DEFAULT_CHATS;
  }
}

// Atomic file write to avoid race conditions and file corruption
function writeChatData(data) {
  try {
    const dir = path.dirname(CHATS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpFile = `${CHATS_FILE}.${Date.now()}.${Math.random().toString(36).substring(7)}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, CHATS_FILE);
  } catch (err) {
    console.error('Error atomically writing chats file:', err);
  }
}

// Validate and sanitize thread ID to prevent injection / path traversal
function sanitizeThreadId(rawId) {
  if (!rawId || typeof rawId !== 'string') return null;
  const clean = rawId.trim();
  if (clean.length > 64 || !/^[a-zA-Z0-9_\-:]+$/.test(clean)) {
    return null;
  }
  return clean;
}

// Generate or resolve thread ID based on context
function resolveThreadId(body) {
  if (body.threadId && body.threadId.trim().length > 0) {
    const sanitized = sanitizeThreadId(body.threadId);
    if (sanitized) return sanitized;
  }
  if (body.quoteNumber && body.quoteNumber.trim().length > 0) {
    return `thread_quote_${body.quoteNumber.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  if (body.requestNumber && body.requestNumber.trim().length > 0) {
    return `thread_req_${body.requestNumber.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  if (body.contextTag && body.contextTag.trim().length > 0) {
    return `thread_ctx_${body.contextTag.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  return 'thread_general';
}

// GET /api/v1/chat/threads - List chat conversations (Authenticated & Role-Scoped)
router.get('/threads', authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const userId = req.user.id;
    const data = readChatData();
    let threads = [...(data.threads || [])];

    // Bridge DB SupportConversations (scoped by ownership unless admin)
    try {
      const whereCondition = isAdmin ? {} : { customerId: userId };
      const dbConversations = await prisma.supportConversation.findMany({
        where: whereCondition,
        include: {
          customer: {
            select: { id: true, name: true, phoneNumber: true, email: true }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      });

      const dbThreads = dbConversations.map(conv => {
        const lastMsg = conv.messages[0];
        const isWaiting = conv.status === 'WAITING_FOR_AGENT';
        const isHuman = conv.status === 'HUMAN_ACTIVE';
        return {
          id: conv.id,
          customerName: conv.customer?.name || (conv.customerId ? `User (${conv.customerId.slice(0, 8)})` : 'Customer'),
          customerPhone: conv.customer?.phoneNumber || '+91 94628 77757',
          contextType: isWaiting ? 'SUPPORT_QUEUE' : (isHuman ? 'HUMAN_ACTIVE' : 'AI_ACTIVE'),
          contextTag: conv.subject || 'Live Support Chat',
          status: conv.status,
          quoteNumber: '',
          requestNumber: '',
          lastMessage: lastMsg ? lastMsg.content : (isWaiting ? '⚠️ Transferred to human support desk' : 'Chat started'),
          lastMessageTime: (lastMsg?.createdAt || conv.updatedAt || conv.createdAt).toISOString(),
          unreadCountAdmin: isWaiting ? 1 : 0,
          unreadCountCustomer: 0,
          createdAt: conv.createdAt.toISOString(),
          isDbConversation: true
        };
      });

      // Merge: DB conversations first, then file threads
      threads = [...dbThreads, ...threads];
    } catch (dbErr) {
      console.warn('Could not fetch DB support conversations for threads:', dbErr.message);
    }

    // Filter file threads if user is not admin
    if (!isAdmin) {
      threads = threads.filter(t => t.isDbConversation || t.customerId === userId || t.customerPhone === req.user.phoneNumber);
    }

    // Sort threads by last message time descending
    threads.sort((a, b) => {
      return new Date(b.lastMessageTime || b.createdAt) - new Date(a.lastMessageTime || a.createdAt);
    });

    res.json({ success: true, data: threads, total: threads.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch chat threads' });
  }
});

// GET /api/v1/chat/threads/:threadId/messages - Get messages for a thread
router.get('/threads/:threadId/messages', authenticate, async (req, res) => {
  try {
    const threadId = sanitizeThreadId(req.params.threadId);
    if (!threadId) {
      return res.status(400).json({ success: false, message: 'Invalid thread ID format' });
    }

    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const userId = req.user.id;
    let threadMessages = [];

    // Check if threadId matches a DB SupportConversation
    try {
      const dbConv = await prisma.supportConversation.findUnique({
        where: { id: threadId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (dbConv) {
        // Enforce ownership: non-admin can only access own conversation
        if (!isAdmin && dbConv.customerId && dbConv.customerId !== userId) {
          return res.status(403).json({ success: false, message: 'Access denied to this conversation' });
        }

        if (dbConv.messages && dbConv.messages.length > 0) {
          threadMessages = dbConv.messages.map(m => ({
            id: m.id,
            threadId: threadId,
            sender: m.senderType === 'CUSTOMER' ? 'customer' : (m.senderType === 'AGENT' ? 'admin' : (m.senderType === 'AI' ? 'ai' : 'system')),
            senderName: m.senderType === 'CUSTOMER' ? 'Customer' : (m.senderType === 'AGENT' ? 'Er. Vikram Sharma (Admin)' : (m.senderType === 'AI' ? 'Hipro AI' : 'System')),
            text: m.content,
            createdAt: m.createdAt.toISOString(),
            isRead: true
          }));
        }
      }
    } catch (dbErr) {
      // not a uuid or DB conversation
    }

    if (threadMessages.length === 0) {
      const data = readChatData();
      const thread = (data.threads || []).find(t => t.id === threadId);
      if (thread && !isAdmin && thread.customerId && thread.customerId !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied to this thread' });
      }
      threadMessages = (data.messages || []).filter(m => m.threadId === threadId);
    }

    res.json({
      success: true,
      threadId,
      data: threadMessages,
      total: threadMessages.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// POST /api/v1/chat/messages - Send a message (Authenticated & Protected against impersonation)
router.post('/messages', authenticate, chatMessageLimiter, async (req, res) => {
  try {
    const {
      sender, // client may claim 'customer' or 'admin'
      senderName,
      text,
      contextType,
      contextTag,
      quoteNumber,
      requestNumber,
      customerName,
      customerPhone,
      threadId: rawThreadId
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const isAdmin = req.user && (
      req.user.role === 'ADMIN' ||
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'AGENT'
    );

    if (sender === 'admin' && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin impersonation detected. Only verified administrators may send admin messages.'
      });
    }

    const effectiveSender = isAdmin ? 'admin' : 'customer';
    const effectiveSenderType = isAdmin ? 'AGENT' : 'CUSTOMER';

    const threadId = rawThreadId ? sanitizeThreadId(rawThreadId) : resolveThreadId(req.body);
    if (!threadId) {
      return res.status(400).json({ success: false, message: 'Invalid thread ID format' });
    }

    // 1. Check if threadId matches a database SupportConversation
    try {
      const dbConv = await prisma.supportConversation.findUnique({
        where: { id: threadId }
      });

      if (dbConv) {
        if (!isAdmin && dbConv.customerId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You cannot access or write to another user\'s support conversation'
          });
        }

        const savedDbMessage = await prisma.supportMessage.create({
          data: {
            conversationId: threadId,
            senderType: effectiveSenderType,
            content: text.trim()
          }
        });

        if (isAdmin) {
          await prisma.supportConversation.update({
            where: { id: threadId },
            data: { status: 'HUMAN_ACTIVE' }
          });
        }

        const io = req.app.get('io');
        if (io) {
          io.to(`conversation:${threadId}`).emit('chat:new_message', savedDbMessage);
          io.to(`thread_${threadId}`).emit('new_message', {
            id: savedDbMessage.id,
            threadId,
            sender: sender || 'admin',
            senderName: senderName || 'Er. Vikram Sharma (Admin)',
            text: text.trim(),
            createdAt: savedDbMessage.createdAt.toISOString(),
            isRead: true
          });
          // Only broadcast thread update to authorized admin room (NOT global io.emit)
          io.to('admin').emit('thread_updated', {
            id: threadId,
            lastMessage: text.trim(),
            lastMessageTime: savedDbMessage.createdAt.toISOString()
          });
        }

        return res.json({
          success: true,
          data: {
            id: savedDbMessage.id,
            threadId,
            sender: sender || 'admin',
            senderName: senderName || 'Er. Vikram Sharma (Admin)',
            text: text.trim(),
            createdAt: savedDbMessage.createdAt.toISOString(),
            isRead: true
          }
        });
      }
    } catch (dbErr) {
      // not a uuid, continue to file
    }

    const data = readChatData();

    // Find or create thread
    let thread = (data.threads || []).find(t => t.id === threadId);
    const nowIso = new Date().toISOString();

    if (!thread) {
      let derivedTag = contextTag || 'Technical Consultation';
      if (quoteNumber) derivedTag = `Quotation #${quoteNumber}`;
      else if (requestNumber) derivedTag = `Request #${requestNumber}`;

      thread = {
        id: threadId,
        customerName: customerName || (sender === 'customer' ? senderName || 'Client' : 'Client'),
        customerPhone: customerPhone || '+91 94628 77757',
        contextType: contextType || (quoteNumber ? 'QUOTATION' : requestNumber ? 'REQUEST' : 'GENERAL'),
        contextTag: derivedTag,
        quoteNumber: quoteNumber || '',
        requestNumber: requestNumber || '',
        lastMessage: text.trim(),
        lastMessageTime: nowIso,
        unreadCountAdmin: sender === 'customer' ? 1 : 0,
        unreadCountCustomer: sender === 'admin' ? 1 : 0,
        createdAt: nowIso
      };
      data.threads.unshift(thread);
    } else {
      thread.lastMessage = text.trim();
      thread.lastMessageTime = nowIso;
      if (sender === 'customer') {
        thread.unreadCountAdmin = (thread.unreadCountAdmin || 0) + 1;
      } else {
        thread.unreadCountCustomer = (thread.unreadCountCustomer || 0) + 1;
      }
      if (customerName && (!thread.customerName || thread.customerName === 'Client')) {
        thread.customerName = customerName;
      }
    }

    // Create Message Object
    const newMessage = {
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      threadId,
      sender: sender || 'customer',
      senderName: senderName || (sender === 'admin' ? 'Er. Vikram Sharma (Admin)' : 'Client'),
      text: text.trim(),
      createdAt: nowIso,
      isRead: false
    };

    data.messages.push(newMessage);
    writeChatData(data);

    // Real-Time Socket.io Broadcast — strictly scoped to room
    const io = req.app.get('io');
    if (io) {
      // Broadcast to thread room
      io.to(`thread_${threadId}`).emit('new_message', newMessage);
      // Broadcast update strictly to admin room (NOT global io.emit)
      io.to('admin').emit('thread_updated', { thread, message: newMessage });
    }

    // If Admin replied, generate notification for customer app
    if (sender === 'admin') {
      try {
        const { addNotification } = require('./notifications');
        const snippet = text.trim().length > 100 ? text.trim().substring(0, 97) + '...' : text.trim();
        addNotification({
          title: `💬 New Message from ${senderName || 'Hipro Technical Lead'}`,
          description: snippet,
          type: 'CHAT',
          referenceId: threadId,
          threadId: threadId,
          quoteNumber: thread.quoteNumber || '',
          requestNumber: thread.requestNumber || '',
          bookingNumber: thread.bookingNumber || '',
          projectName: thread.contextTag || 'Technical Consultation',
          unread: true,
          timestamp: nowIso
        }, io);
      } catch (errNotif) {
        console.error('Failed to dispatch notification for chat message:', errNotif);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage,
      thread
    });
  } catch (error) {
    console.error('Send chat message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// PATCH /api/v1/chat/threads/:threadId/read - Mark messages as read
router.patch('/threads/:threadId/read', (req, res) => {
  try {
    const threadId = sanitizeThreadId(req.params.threadId);
    if (!threadId) {
      return res.status(400).json({ success: false, message: 'Invalid thread ID format' });
    }
    const { reader } = req.body; // 'admin' or 'customer'
    const data = readChatData();

    const thread = (data.threads || []).find(t => t.id === threadId);
    if (thread) {
      if (reader === 'admin') {
        thread.unreadCountAdmin = 0;
      } else {
        thread.unreadCountCustomer = 0;
      }
    }

    (data.messages || []).forEach(m => {
      if (m.threadId === threadId) {
        if (reader === 'admin' && m.sender === 'customer') {
          m.isRead = true;
        } else if (reader === 'customer' && m.sender === 'admin') {
          m.isRead = true;
        }
      }
    });

    writeChatData(data);

    const io = req.app.get('io');
    if (io) {
      io.to(`thread_${threadId}`).emit('messages_read', { threadId, reader });
      io.to('admin').emit('messages_read', { threadId, reader });
    }

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
  }
});

module.exports = router;
module.exports.readChatData = readChatData;
