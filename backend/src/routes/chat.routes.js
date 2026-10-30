const express = require('express');
const router = express.Router();
const {
  createConversation,
  sendMessage,
  getConversationMessages,
  getCustomerConversations,
  customerHandoff
} = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

// All chat routes require valid customer authentication
router.use(authenticate);

router.post('/conversations', createConversation);
router.get('/conversations', getCustomerConversations);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/message', sendMessage);
router.post('/conversations/:id/handoff', customerHandoff);

module.exports = router;

