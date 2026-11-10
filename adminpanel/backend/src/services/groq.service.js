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
    return null;
  }

  let model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  if (!model || model.includes('llama') || model.includes('mixtral')) {
    model = 'openai/gpt-oss-120b';
  }

  const systemPrompt = `
You are the official Hipro Home & Civil Services Customer Support AI Assistant.
Rules:
1. Answer customer queries politely, accurately, and concisely using only the verified services, pricing, slots, and policies in the Knowledge Base below.
2. Strictly READ-ONLY: Never execute or promise database writes, cancellations, or payment refunds.
3. If customer requests a human or real agent, escalate immediately.
4. Return a valid JSON object matching:
{
  "reply": "Your response to customer",
  "escalate": false,
  "reason": null
}

Knowledge Base:
${knowledge || ''}

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
    throw err;
  }

  const rawContent = response?.choices?.[0]?.message?.content;
  const parsed = parseModelJson(rawContent);

  if (!parsed || !parsed.reply) {
    throw new Error('Could not parse response from Groq');
  }

  return parsed;
}

module.exports = { askGroq };

