const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
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

// Database-backed AI Chatbot & Customer Support Routes
router.post('/conversations', authenticate, createConversation);
router.get('/conversations', authenticate, getCustomerConversations);
router.get('/conversations/:id/messages', authenticate, getConversationMessages);
router.post('/message', authenticate, sendMessage);
router.post('/conversations/:id/handoff', authenticate, customerHandoff);
router.post('/conversations/:id/reset-ai', authenticate, resetToAi);

const CHATS_FILE = path.join(__dirname, '../../uploads/chats.json');

// Default initial chat thread (empty - real chats only)
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

function writeChatData(data) {
  try {
    fs.mkdirSync(path.dirname(CHATS_FILE), { recursive: true });
    fs.writeFileSync(CHATS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing chats file:', err);
  }
}

// Generate or resolve thread ID based on context
function resolveThreadId(body) {
  if (body.threadId && body.threadId.trim().length > 0) {
    return body.threadId.trim();
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

// GET /api/v1/chat/threads - List all chat conversations (Admin View)
router.get('/threads', async (req, res) => {
  try {
    const data = readChatData();
    let threads = [...(data.threads || [])];

    // Bridge DB SupportConversations (especially those transferred to human support or waiting)
    try {
      const dbConversations = await prisma.supportConversation.findMany({
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
router.get('/threads/:threadId/messages', async (req, res) => {
  try {
    const { threadId } = req.params;
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

      if (dbConv && dbConv.messages && dbConv.messages.length > 0) {
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
    } catch (dbErr) {
      // not a uuid or DB conversation
    }

    if (threadMessages.length === 0) {
      const data = readChatData();
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

// POST /api/v1/chat/messages - Send a message (Customer or Admin)
router.post('/messages', async (req, res) => {
  try {
    const {
      sender, // 'customer' or 'admin'
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

    const threadId = rawThreadId || resolveThreadId(req.body);

    // 1. Check if threadId matches a database SupportConversation
    try {
      const dbConv = await prisma.supportConversation.findUnique({
        where: { id: threadId }
      });

      if (dbConv) {
        const savedDbMessage = await prisma.supportMessage.create({
          data: {
            conversationId: threadId,
            senderType: sender === 'admin' ? 'AGENT' : 'CUSTOMER',
            content: text.trim()
          }
        });

        if (sender === 'admin') {
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
          io.to('support:agents').emit('thread_updated', {
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

    // Real-Time Socket.io Broadcast
    const io = req.app.get('io');
    if (io) {
      // Broadcast to thread room
      io.to(`thread_${threadId}`).emit('new_message', newMessage);
      // Broadcast globally to all connected admins/monitors
      io.emit('thread_updated', { thread, message: newMessage });
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
    const { threadId } = req.params;
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
      io.emit('messages_read', { threadId, reader });
    }

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
  }
});

module.exports = router;
module.exports.readChatData = readChatData;
