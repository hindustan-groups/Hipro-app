const Groq = require('groq-sdk');

let groqClient = null;

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}
 
/**
 * Ask Groq (Automatic Fallback AI)
 * Read-Only knowledge evaluation with structured JSON response.
 */
async function askGroq(messages, knowledge, customerContext = null) {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured or available.');
  }

  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  const systemPrompt = `
You are the official Hipro Home & Civil Services Customer Support AI Assistant (Backup Engine).
Rules:
1. Answer using ONLY the verified service knowledge and catalog provided below.
2. Strictly READ-ONLY: Never execute or promise database writes, cancellations, or payment refunds.
3. If customer context is provided, you may state their current booking or inspection status.
4. If customer requests a human or agent, escalate immediately.
5. Return ONLY a valid JSON object matching:
{
  "reply": "Your response to customer",
  "escalate": false,
  "reason": null
}

Knowledge Base:
${knowledge || 'Hipro provides home maintenance, civil engineering, waterproofing, plumbing, painting, and inspection services.'}

${customerContext ? `Customer Context (Read-Only):\n${JSON.stringify(customerContext, null, 2)}` : ''}
`;

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: (msg.senderType === 'AI' || msg.sender_type === 'AI') ? 'assistant' : 'user',
      content: msg.content
    }))
  ];

  const response = await groq.chat.completions.create({
    model,
    messages: formattedMessages,
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 600
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response received from Groq API');
  }

  return JSON.parse(content);
}

module.exports = { askGroq };

