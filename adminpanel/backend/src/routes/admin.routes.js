const express = require('express');
const router = express.Router();
const {
  getSupportQueue,
  acceptConversation,
  agentReply,
  resolveConversation,
  setAgentAvailability,
  registerAgent,
  getKnowledgeArticles,
  createKnowledgeArticle
} = require('../controllers/admin.controller');
const { authenticate, requireAgent } = require('../middleware/auth');

// Support Agent & Admin API endpoints
router.use(authenticate, requireAgent);

router.get('/queue', getSupportQueue);
router.post('/conversations/:id/accept', acceptConversation);
router.post('/conversations/:id/reply', agentReply);
router.post('/conversations/:id/resolve', resolveConversation);
router.patch('/availability', setAgentAvailability);

// Agent registration & Knowledge base management
router.post('/agents', registerAgent);
router.get('/knowledge', getKnowledgeArticles);
router.post('/knowledge', createKnowledgeArticle);

module.exports = router;

