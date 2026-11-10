const prisma = require('../prisma');

/**
 * Initiates an AI-to-Human Handoff
 * Updates conversation status, records handoff event, and alerts active agents via Socket.io.
 */
async function requestHandoff(conversationId, reason, io) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify conversation is in AI_ACTIVE state and atomically update
      const updated = await tx.supportConversation.updateMany({
        where: {
          id: conversationId,
          status: 'AI_ACTIVE'
        },
        data: {
          status: 'WAITING_FOR_AGENT',
          assignedAgentId: null,
          handoffReason: reason || 'Customer requested human support'
        }
      });

      if (updated.count === 0) {
        return null;
      }

      // 2. Log handoff history
      await tx.supportHandoff.create({
        data: {
          conversationId,
          reason: reason || 'Customer requested human support'
        }
      });

      // 3. Post system message into thread
      const systemMessage = await tx.supportMessage.create({
        data: {
          conversationId,
          senderType: 'SYSTEM',
          content: 'Your conversation has been transferred to our human support team. An agent will connect with you shortly.'
        }
      });

      return systemMessage;
    });

    if (!result) return null;

    if (io) {
      io.to(`conversation:${conversationId}`).emit('conversation:status', {
        status: 'WAITING_FOR_AGENT',
        conversationId
      });
      io.to(`conversation:${conversationId}`).emit('chat:new_message', result);
      io.to('support:agents').emit('support:new_handoff', {
        conversationId,
        reason
      });
    }

    return result;
  } catch (error) {
    console.error('Error in requestHandoff:', error);
    throw error;
  }
}

/**
 * Human Agent accepts a waiting conversation
 */
async function acceptConversation(conversationId, agentUserId, io) {
  try {
    const conversation = await prisma.$transaction(async (tx) => {
      // 1. Verify agent exists & is online or busy
      const agent = await tx.supportAgent.findUnique({
        where: { userId: agentUserId }
      });

      if (!agent || !agent.isActive || !['ONLINE', 'BUSY'].includes(agent.availability)) {
        throw new Error('Support agent is not active or available');
      }

      // 2. Atomically claim waiting conversation
      const updated = await tx.supportConversation.updateMany({
        where: {
          id: conversationId,
          status: 'WAITING_FOR_AGENT',
          assignedAgentId: null
        },
        data: {
          status: 'HUMAN_ACTIVE',
          assignedAgentId: agent.id
        }
      });

      if (updated.count === 0) {
        throw new Error('Conversation has already been accepted or is unavailable');
      }

      // 3. Mark handoff accepted timestamp
      await tx.supportHandoff.updateMany({
        where: {
          conversationId,
          acceptedAt: null
        },
        data: {
          acceptedById: agent.id,
          acceptedAt: new Date()
        }
      });

      // 4. Update agent availability
      await tx.supportAgent.update({
        where: { id: agent.id },
        data: { availability: 'BUSY' }
      });

      // 5. Post system message
      await tx.supportMessage.create({
        data: {
          conversationId,
          senderType: 'SYSTEM',
          content: 'A support specialist has joined your conversation.'
        }
      });

      return tx.supportConversation.findUnique({
        where: { id: conversationId },
        include: {
          customer: { select: { id: true, name: true, phoneNumber: true, email: true } },
          assignedAgent: { include: { user: { select: { id: true, name: true } } } }
        }
      });
    });

    if (io) {
      io.to(`conversation:${conversationId}`).emit('conversation:status', {
        status: 'HUMAN_ACTIVE',
        assignedAgentId: conversation.assignedAgentId
      });
      io.to('support:agents').emit('support:queue_updated', {
        conversationId
      });
    }

    return conversation;
  } catch (error) {
    console.error('Error in acceptConversation:', error);
    throw error;
  }
}

/**
 * Resolves / closes an active conversation
 */
async function resolveConversation(conversationId, agentUserId, io) {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const agent = await tx.supportAgent.findUnique({
        where: { userId: agentUserId }
      });

      const conv = await tx.supportConversation.findUnique({
        where: { id: conversationId }
      });

      if (!conv || conv.status === 'RESOLVED') {
        throw new Error('Conversation is not active or already closed');
      }

      const closed = await tx.supportConversation.update({
        where: { id: conversationId },
        data: {
          status: 'RESOLVED',
          closedAt: new Date()
        }
      });

      // Mark handoff resolved
      await tx.supportHandoff.updateMany({
        where: { conversationId, resolvedAt: null },
        data: { resolvedAt: new Date() }
      });

      // Reset agent availability to ONLINE if they have no other active chats
      if (agent) {
        const otherActive = await tx.supportConversation.count({
          where: {
            assignedAgentId: agent.id,
            status: 'HUMAN_ACTIVE'
          }
        });

        if (otherActive === 0) {
          await tx.supportAgent.update({
            where: { id: agent.id },
            data: { availability: 'ONLINE' }
          });
        }
      }

      // Add close notification
      await tx.supportMessage.create({
        data: {
          conversationId,
          senderType: 'SYSTEM',
          content: 'This support conversation has been resolved. Thank you for contacting Hipro Support.'
        }
      });

      return closed;
    });

    if (io) {
      io.to(`conversation:${conversationId}`).emit('conversation:status', {
        status: 'RESOLVED'
      });
      io.to('support:agents').emit('support:queue_updated', {
        conversationId
      });
    }

    return updated;
  } catch (error) {
    console.error('Error in resolveConversation:', error);
    throw error;
  }
}

module.exports = {
  requestHandoff,
  acceptConversation,
  resolveConversation
};

