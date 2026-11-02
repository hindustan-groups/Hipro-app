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

function generateContextualFallback(latestMessage) {
  const lower = (latestMessage || '').toLowerCase();
  if (lower.includes('slot') || lower.includes('time') || lower.includes('timing') || lower.includes('available') || lower.includes('schedule') || lower.includes('when')) {
    return "Our inspection and consultation slots are available daily in two shifts: Morning (10:00 AM – 1:00 PM) and Afternoon (2:00 PM – 6:00 PM). Which slot and city works best for you?";
  }
  if (lower.includes('cost') || lower.includes('price') || lower.includes('rate') || lower.includes('charge') || lower.includes('fee') || lower.includes('kitna')) {
    return "Visiting and technical audit charges start at ₹199 for all civil inspections, waterproofing assessments, and structural checks across Jaipur, Jodhpur, Udaipur, and Bhilwara. Which service would you like to explore?";
  }
  if (lower.includes('waterproof') || lower.includes('leak') || lower.includes('damp') || lower.includes('seepage') || lower.includes('crack')) {
    return "Hipro provides certified waterproofing treatments including Dr. Fixit PU coating, crystalline crack injection, and roof waterproofing with up to 10-year warranty. What issue are you observing in your property?";
  }
  if (lower.includes('city') || lower.includes('where') || lower.includes('location') || lower.includes('kaha')) {
    return "Hipro currently serves Jaipur, Jodhpur, Udaipur, and Bhilwara with verified engineering teams and local partner centers. Which city are you located in?";
  }
  return "Namaste! Welcome to Hipro Support. I can help you with home inspections, waterproofing, direct bookings, pricing, or technical questions. How may I assist you today?";
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
    const groqResult = await withTimeout(askGroq(messages, knowledge, customerContext), 12000);
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
      const result = await withTimeout(askGemini(messages, knowledge, customerContext), 8000);
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

  // 4. Safe Context-Aware Fallback (Answers user's specific query without generic repetition)
  return {
    reply: generateContextualFallback(latestMessage),
    escalate: false,
    reason: null,
    provider: 'contextual-fallback'
  };
}

module.exports = { generateAIResponse };
