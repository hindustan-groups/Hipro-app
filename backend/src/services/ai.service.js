const { askGemini } = require('./gemini.service');
const { askGroq } = require('./groq.service');

// Fast regex check for explicit human requests
const HUMAN_REQUEST_PATTERN = /\b(human|agent|real person|customer support|support agent|call me|talk to someone|representative|helpline|executive|complaint|refund|cancel)\b/i;

/**
 * Execute an async AI call with a strict timeout
 */
function withTimeout(promise, ms = 7000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI Request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * AI Response Router with Intelligent Provider Selection and Automatic Fallback
 * Strictly Read-Only: Never executes database writes.
 */
async function generateAIResponse(messages, knowledge, customerContext = null) {
  const latestMessage = messages[messages.length - 1]?.content || '';

  // 1. Explicit human support request: immediately route to human
  if (HUMAN_REQUEST_PATTERN.test(latestMessage)) {
    return {
      reply: 'Connecting you with our support team right now. An agent will assist you shortly.',
      escalate: true,
      reason: 'Customer requested human assistance',
      provider: 'none'
    };
  }

  // 2. Ultra-Fast Groq Engine (Always available with cloud fallback)
  try {
    const groqResult = await withTimeout(askGroq(messages, knowledge, customerContext), 7000);
    if (groqResult && groqResult.reply) {
      return {
        reply: groqResult.reply,
        escalate: !!groqResult.escalate,
        reason: groqResult.reason || null,
        provider: 'groq'
      };
    }
  } catch (groqError) {
    console.warn(`[AI Service] Groq primary engine error: ${groqError.message}`);
  }

  // 3. Secondary Gemini Engine
  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (geminiKey && geminiKey.length > 10) {
    try {
      const result = await withTimeout(askGemini(messages, knowledge, customerContext), 6000);
      if (result && result.reply) {
        return {
          reply: result.reply,
          escalate: !!result.escalate,
          reason: result.reason || null,
          provider: 'gemini'
        };
      }
    } catch (geminiError) {
      console.warn(`[AI Service] Secondary Gemini failed: ${geminiError.message}`);
    }
  }

  // 4. Safe AI Fallback - NEVER force human handoff on normal messages or gibberish
  return {
    reply: "Namaste! Welcome to Hipro Support. I can help you with home inspections, waterproofing, direct bookings, pricing, or technical questions. How may I assist you today?",
    escalate: false,
    reason: null,
    provider: 'local-fallback'
  };
}

module.exports = { generateAIResponse };
