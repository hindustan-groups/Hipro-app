const prisma = require('../prisma');
const { generateAIResponse } = require('../services/ai.service');
const { getSystemKnowledge, getCustomerReadOnlyContext } = require('../services/support-context.service');
const { requestHandoff } = require('../services/handoff.service');

/**
 * POST /api/chat/conversations
 * Start a new support conversation or retrieve an active one.
 * Always ensures AI handles new chat sessions.
 */
async function createConversation(req, res) {
  try {
    const customerId = req.user.id;
    const { subject, forceNew } = req.body;

    // 1. If explicit forceNew requested, resolve prior conversations so this starts 100% fresh with AI
    if (forceNew) {
      await prisma.supportConversation.updateMany({
        where: {
          customerId,
          status: { in: ['AI_ACTIVE', 'WAITING_FOR_AGENT', 'HUMAN_ACTIVE'] }
        },
        data: {
          status: 'RESOLVED',
          closedAt: new Date()
        }
      });
    }

    // 2. Look for existing open conversation
    let conversation = null;
    if (!forceNew) {
      conversation = await prisma.supportConversation.findFirst({
        where: {
          customerId,
          status: { in: ['AI_ACTIVE', 'WAITING_FOR_AGENT', 'HUMAN_ACTIVE'] }
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // KEY FIX: If an existing conversation was transferred to human (WAITING_FOR_AGENT or HUMAN_ACTIVE),
      // we must NOT lock the user into human-only forever.
      // If the handoff is idle / older than 15 minutes without an active agent replying,
      // or if the user is opening chat for a different topic, auto-resolve it and start fresh with AI!
      if (conversation && conversation.status !== 'AI_ACTIVE') {
        const lastActivity = new Date(conversation.updatedAt).getTime();
        const isStale = Date.now() - lastActivity > (15 * 60 * 1000); // 15 mins inactivity
        const isDifferentSubject = subject && conversation.subject && subject !== conversation.subject;

        if (isStale || isDifferentSubject) {
          await prisma.supportConversation.update({
            where: { id: conversation.id },
            data: {
              status: 'RESOLVED',
              closedAt: new Date()
            }
          });
          conversation = null; // Forces new AI_ACTIVE conversation below
        }
      }
    }

    // 3. Create fresh conversation with status AI_ACTIVE
    if (!conversation) {
      conversation = await prisma.supportConversation.create({
        data: {
          customerId,
          subject: subject || 'General Customer Support',
          status: 'AI_ACTIVE',
          messages: {
            create: {
              senderType: 'AI',
              content: 'Namaste! Welcome to Hipro Support. I am your AI Assistant. How can I help you today with inspections, waterproofing, bookings, or pricing?'
            }
          }
        },
        include: {
          messages: true
        }
      });
    }

    return res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create support conversation',
      error: error.message
    });
  }
}

/**
 * POST /api/chat/message
 * Send a message and trigger AI response or human routing
 */
async function sendMessage(req, res) {
  try {
    const customerId = req.user.id;
    const { conversationId, message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim() || message.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'Message must be between 1 and 4000 characters'
      });
    }

    // 1. Verify conversation ownership
    const conversation = await prisma.supportConversation.findFirst({
      where: {
        id: conversationId,
        customerId
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Support conversation not found'
      });
    }

    if (conversation.status === 'RESOLVED') {
      return res.status(409).json({
        success: false,
        message: 'This conversation has been resolved. Please start a new conversation.'
      });
    }

    const io = req.app.get('io');

    // 2. Persist Customer Message
    const savedCustomerMessage = await prisma.supportMessage.create({
      data: {
        conversationId,
        senderType: 'CUSTOMER',
        senderId: customerId,
        content: message.trim()
      }
    });

    // Broadcast customer message to room
    if (io) {
      io.to(`conversation:${conversationId}`).emit('chat:new_message', savedCustomerMessage);
      io.to('support:agents').emit('support:customer_message', {
        conversationId,
        message: savedCustomerMessage
      });
    }

    // 3. If a human agent is currently handling this conversation, do NOT invoke AI
    if (conversation.status === 'HUMAN_ACTIVE') {
      return res.json({
        success: true,
        mode: conversation.status,
        message: savedCustomerMessage
      });
    }

    // 4. AI MODE: Gather read-only context (Strictly Read-Only, no writes)
    const [recentMessages, knowledge, customerContext] = await Promise.all([
      prisma.supportMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 12
      }),
      getSystemKnowledge(),
      getCustomerReadOnlyContext(customerId)
    ]);

    const chronologicalHistory = recentMessages.reverse();

    // 5. Generate AI Response with Automatic Groq Fallback
    const aiResult = await generateAIResponse(chronologicalHistory, knowledge, customerContext);

    // 6. Handle Escalation to Human Support
    if (aiResult.escalate) {
      const handoffSystemMessage = await requestHandoff(
        conversationId,
        aiResult.reason || 'AI requested escalation',
        io
      );

      return res.json({
        success: true,
        mode: 'WAITING_FOR_AGENT',
        escalated: true,
        reason: aiResult.reason,
        provider: aiResult.provider,
        systemMessage: handoffSystemMessage
      });
    }

    // 7. Re-check status before saving AI reply: only suppress if an agent actually joined as HUMAN_ACTIVE
    const freshStatus = await prisma.supportConversation.findUnique({
      where: { id: conversationId },
      select: { status: true }
    });

    if (freshStatus?.status === 'HUMAN_ACTIVE') {
      return res.json({
        success: true,
        mode: 'HUMAN_ACTIVE'
      });
    }

    // 8. Save and emit AI Reply
    const savedAiMessage = await prisma.supportMessage.create({
      data: {
        conversationId,
        senderType: 'AI',
        content: aiResult.reply
      }
    });

    if (io) {
      io.to(`conversation:${conversationId}`).emit('chat:new_message', savedAiMessage);
    }

    return res.json({
      success: true,
      mode: freshStatus?.status || 'AI_ACTIVE',
      provider: aiResult.provider,
      message: savedAiMessage
    });
  } catch (error) {
    console.error('Error handling customer message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process customer message',
      error: error.message
    });
  }
}

/**
 * GET /api/chat/conversations/:id/messages
 * Retrieve messages for a specific conversation
 */
async function getConversationMessages(req, res) {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    const conversation = await prisma.supportConversation.findFirst({
      where: {
        id,
        customerId
      },
      include: {
        assignedAgent: {
          include: {
            user: { select: { id: true, name: true, photoUrl: true } }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const messages = await prisma.supportMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 200
    });

    return res.json({
      success: true,
      conversation,
      messages
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation messages',
      error: error.message
    });
  }
}

/**
 * GET /api/chat/conversations
 * Get all conversations of current customer
 */
async function getCustomerConversations(req, res) {
  try {
    const customerId = req.user.id;

    const conversations = await prisma.supportConversation.findMany({
      where: { customerId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return res.json({
      success: true,
      conversations
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
}

/**
 * POST /api/chat/conversations/:id/handoff
 * Explicit customer request to transfer to human agent
 */
async function customerHandoff(req, res) {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    const conversation = await prisma.supportConversation.findFirst({
      where: {
        id,
        customerId,
        status: 'AI_ACTIVE'
      }
    });

    if (!conversation) {
      return res.status(409).json({
        success: false,
        message: 'Conversation is not eligible for handoff or is already assigned'
      });
    }

    const io = req.app.get('io');
    const systemMessage = await requestHandoff(
      id,
      'Customer explicitly requested human support',
      io
    );

    return res.json({
      success: true,
      status: 'WAITING_FOR_AGENT',
      systemMessage
    });
  } catch (error) {
    console.error('Error initiating customer handoff:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to request human support',
      error: error.message
    });
  }
}

/**
 * POST /api/chat/conversations/:id/reset-ai
 * Explicitly reset a conversation back to AI handling
 */
async function resetToAi(req, res) {
  try {
    const { id } = req.params;
    const customerId = req.user.id;
    const io = req.app.get('io');

    const conversation = await prisma.supportConversation.findFirst({
      where: {
        id,
        customerId
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Support conversation not found'
      });
    }

    const updated = await prisma.supportConversation.update({
      where: { id },
      data: {
        status: 'AI_ACTIVE',
        assignedAgentId: null,
        handoffReason: null
      }
    });

    const sysMsg = await prisma.supportMessage.create({
      data: {
        conversationId: id,
        senderType: 'SYSTEM',
        content: 'Switched back to AI Assistant. How can I help you today?'
      }
    });

    if (io) {
      io.to(`conversation:${id}`).emit('chat:new_message', sysMsg);
      io.to(`conversation:${id}`).emit('support:status_changed', {
        conversationId: id,
        status: 'AI_ACTIVE'
      });
      io.to('support:agents').emit('support:queue_updated', { conversationId: id });
    }

    return res.json({
      success: true,
      status: 'AI_ACTIVE',
      conversation: updated,
      message: sysMsg
    });
  } catch (error) {
    console.error('Error resetting conversation to AI:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset to AI assistant',
      error: error.message
    });
  }
}

module.exports = {
  createConversation,
  sendMessage,
  getConversationMessages,
  getCustomerConversations,
  customerHandoff,
  resetToAi
};

