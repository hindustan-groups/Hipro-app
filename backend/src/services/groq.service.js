const Groq = require('groq-sdk');

function createClient(apiKey) {
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

function parseModelJson(content) {
  if (!content) return null;
  // 1. Direct parse
  try {
    return JSON.parse(content);
  } catch (_) {}

  // 2. Extract JSON block from markdown if present
  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  // 3. Fallback: Wrap raw string response as reply
  return {
    reply: content.replace(/```[a-z]*\n?/g, '').trim(),
    escalate: false,
    reason: null
  };
}

/**
 * Ask Groq (Ultra-Fast Knowledge-Based Customer Support AI)
 * Read-Only knowledge evaluation with automatic failover.
 */
async function askGroq(messages, knowledge, customerContext = null) {
  const apiKey = (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_'))
    ? process.env.GROQ_API_KEY
    : null;

  if (!apiKey) {
    return {
      reply: 'Hello! I am Hipro Support Assistant. A support representative will be with you shortly.',
      escalate: true,
      reason: 'AI service key not configured'
    };
  }

  let model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  if (!model || model.includes('llama') || model.includes('mixtral')) {
    model = 'openai/gpt-oss-120b';
  }

  const systemPrompt = `
You are the official Hipro Home & Civil Services Customer Support AI Assistant.
Rules:
1. Answer customer queries politely, accurately, and concisely based on Hipro services (Waterproofing, Home Inspection, Structural Repairs, Civil Audits, Painting, Tile & Flooring).
2. For visiting charges: Inspection visits start at ₹199 across Jaipur, Jodhpur, Udaipur, and Bhilwara.
3. For slots: Inform the customer that inspection and service slots are available daily in two shifts: Morning (10:00 AM – 1:00 PM) and Afternoon (2:00 PM – 6:00 PM).
4. Strictly READ-ONLY: Never execute or promise database writes, cancellations, or payment refunds.
5. If customer requests a human or real agent, escalate immediately.
6. Return a valid JSON object matching:
{
  "reply": "Your response to customer",
  "escalate": false,
  "reason": null
}

Knowledge Base:
${knowledge || 'Hipro provides reliable civil engineering, home inspection, waterproofing, plumbing, painting, and construction care across Rajasthan.'}

${customerContext ? `Customer Context (Read-Only):\n${JSON.stringify(customerContext, null, 2)}` : ''}
`;

  const validMessages = (messages || [])
    .filter(m => m && (m.content || m.text))
    .map(msg => ({
      role: (msg.senderType === 'AI' || msg.sender_type === 'AI') ? 'assistant' : 'user',
      content: (msg.content || msg.text).toString().trim()
    }));

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...validMessages
  ];

  const client = createClient(apiKey);
  let response;

  try {
    response = await client.chat.completions.create({
      model,
      messages: formattedMessages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 600
    });
  } catch (err) {
    console.warn(`[Groq] API call failed (${err.message})`);
    return {
      reply: 'Thank you for reaching out to Hipro Support. A representative will connect with you shortly.',
      escalate: true,
      reason: err.message
    };
  }

  const rawContent = response?.choices?.[0]?.message?.content;
  const parsed = parseModelJson(rawContent);

  if (!parsed || !parsed.reply) {
    throw new Error('Could not parse response from Groq');
  }

  return parsed;
}

module.exports = { askGroq };

