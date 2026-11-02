const express = require('express');
const router = express.Router();
const {
  createConversation,
  sendMessage,
  getConversationMessages,
  getCustomerConversations,
  customerHandoff,
  resetToAi
} = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

// All chat routes require valid customer authentication
router.use(authenticate);

router.post('/conversations', createConversation);
router.get('/conversations', getCustomerConversations);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/message', sendMessage);
router.post('/conversations/:id/handoff', customerHandoff);
router.post('/conversations/:id/reset-ai', resetToAi);

module.exports = router;

