const prisma = require('../prisma');
const { acceptConversation: acceptHandoff, resolveConversation: resolveHandoff } = require('../services/handoff.service');

/**
 * GET /api/admin/support/queue
 * Get live support queue: waiting conversations and active agent assignments
 */
async function getSupportQueue(req, res) {
  try {
    const { status } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    } else {
      where.status = { in: ['WAITING_FOR_AGENT', 'HUMAN_ACTIVE', 'AI_ACTIVE'] };
    }

    const conversations = await prisma.supportConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            photoUrl: true,
            address: {
              select: { city: true, address: true, type: true },
              take: 1
            }
          }
        },
        assignedAgent: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const counts = await prisma.supportConversation.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const statusCounts = {
      AI_ACTIVE: 0,
      WAITING_FOR_AGENT: 0,
      HUMAN_ACTIVE: 0,
      RESOLVED: 0
    };
    counts.forEach(c => {
      statusCounts[c.status] = c._count.id;
    });

    return res.json({
      success: true,
      statusCounts,
      conversations
    });
  } catch (error) {
    console.error('Error fetching support queue:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch support queue',
      error: error.message
    });
  }
}

/**
 * POST /api/admin/support/conversations/:id/accept
 * Support agent accepts a waiting conversation
 */
async function acceptConversation(req, res) {
  try {
    const { id } = req.params;
    const io = req.app.get('io');

    const conversation = await acceptHandoff(id, req.user.id, io);

    return res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error accepting conversation:', error);
    return res.status(409).json({
      success: false,
      message: error.message || 'Unable to accept conversation'
    });
  }
}

/**
 * POST /api/admin/support/conversations/:id/reply
 * Agent sends a live reply to the customer
 */
async function agentReply(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim() || message.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'Message must be between 1 and 4000 characters'
      });
    }

    const conversation = await prisma.supportConversation.findUnique({
      where: { id },
      include: { assignedAgent: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.status !== 'HUMAN_ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Conversation is not currently active with a human agent'
      });
    }

    const savedMessage = await prisma.supportMessage.create({
      data: {
        conversationId: id,
        senderType: 'AGENT',
        senderId: req.user.id,
        content: message.trim()
      }
    });

    await prisma.supportConversation.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${id}`).emit('chat:new_message', savedMessage);
    }

    return res.json({
      success: true,
      message: savedMessage
    });
  } catch (error) {
    console.error('Error sending agent reply:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
}

/**
 * POST /api/admin/support/conversations/:id/resolve
 * Agent or admin closes/resolves a conversation
 */
async function resolveConversation(req, res) {
  try {
    const { id } = req.params;
    const io = req.app.get('io');

    const conversation = await resolveHandoff(id, req.user.id, io);

    return res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error resolving conversation:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to resolve conversation'
    });
  }
}

/**
 * PATCH /api/admin/support/availability
 * Agent toggles online/offline availability
 */
async function setAgentAvailability(req, res) {
  try {
    const { availability } = req.body;
    if (!['ONLINE', 'OFFLINE'].includes(availability)) {
      return res.status(400).json({
        success: false,
        message: "Availability must be 'ONLINE' or 'OFFLINE'"
      });
    }

    const agent = await prisma.supportAgent.findUnique({
      where: { userId: req.user.id }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'No support agent profile found for current user'
      });
    }

    const updated = await prisma.supportAgent.update({
      where: { id: agent.id },
      data: { availability }
    });

    return res.json({
      success: true,
      agent: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
}

/**
 * POST /api/admin/support/agents
 * Admin registers a user as a support agent
 */
async function registerAgent(req, res) {
  try {
    const { userId, availability = 'ONLINE' } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const agent = await prisma.supportAgent.upsert({
      where: { userId },
      update: {
        isActive: true,
        availability
      },
      create: {
        userId,
        availability,
        isActive: true
      }
    });

    return res.status(201).json({
      success: true,
      agent
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to register support agent',
      error: error.message
    });
  }
}

/**
 * GET & POST /api/admin/support/knowledge
 * Knowledge Base Articles management for AI grounding
 */
async function getKnowledgeArticles(req, res) {
  try {
    const articles = await prisma.supportKnowledge.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return res.json({ success: true, articles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createKnowledgeArticle(req, res) {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const article = await prisma.supportKnowledge.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || 'General'
      }
    });

    return res.status(201).json({ success: true, article });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getSupportQueue,
  acceptConversation,
  agentReply,
  resolveConversation,
  setAgentAvailability,
  registerAgent,
  getKnowledgeArticles,
  createKnowledgeArticle
};

