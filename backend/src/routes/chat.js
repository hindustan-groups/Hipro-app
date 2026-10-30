const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const {
  createConversation,
  sendMessage,
  getConversationMessages,
  getCustomerConversations,
  customerHandoff
} = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

// Database-backed AI Chatbot & Customer Support Routes
router.post('/conversations', authenticate, createConversation);
router.get('/conversations', authenticate, getCustomerConversations);
router.get('/conversations/:id/messages', authenticate, getConversationMessages);
router.post('/message', authenticate, sendMessage);
router.post('/conversations/:id/handoff', authenticate, customerHandoff);

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
router.get('/threads', (req, res) => {
  try {
    const data = readChatData();
    // Sort threads by last message time descending
    const threads = (data.threads || []).sort((a, b) => {
      return new Date(b.lastMessageTime || b.createdAt) - new Date(a.lastMessageTime || a.createdAt);
    });
    res.json({ success: true, data: threads, total: threads.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch chat threads' });
  }
});

// GET /api/v1/chat/threads/:threadId/messages - Get messages for a thread
router.get('/threads/:threadId/messages', (req, res) => {
  try {
    const { threadId } = req.params;
    const data = readChatData();
    const threadMessages = (data.messages || []).filter(m => m.threadId === threadId);
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
router.post('/messages', (req, res) => {
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
      customerPhone
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const threadId = resolveThreadId(req.body);
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
