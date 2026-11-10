const { GoogleGenAI } = require('@google/genai');

let aiClient = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Ask Google Gemini (Primary AI)
 * Read-Only knowledge evaluation with structured JSON response.
 */
async function askGemini(messages, knowledge, customerContext = null) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured or available.');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const systemInstruction = `
You are the official Hipro Home & Civil Services Customer Support AI Assistant.
Rules:
1. Answer using ONLY the verified service knowledge and catalog provided below.
2. Strictly READ-ONLY: Never perform, execute, or promise database writes, cancellations, or payment refunds.
3. If customer-specific context is provided, you may inform them of their booking or inspection status.
4. If information is missing or uncertain, politely ask for clarification.
5. If the customer requests a human agent or has an unresolved complaint, escalate immediately.
6. Provide polite, helpful, and concise responses.

Knowledge Base:
${knowledge || 'Hipro provides reliable home inspection, civil engineering, waterproofing, plumbing, painting, and construction care.'}

${customerContext ? `Customer Context (Read-Only):\n${JSON.stringify(customerContext, null, 2)}` : ''}

You MUST return ONLY valid JSON matching this schema:
{
  "reply": "Your response to customer",
  "escalate": false,
  "reason": null
}

If human escalation is requested or required:
{
  "reply": "I am connecting you with our human support team right away.",
  "escalate": true,
  "reason": "Customer requested human support or issue requires human resolution"
}
`;

  const contents = messages.map(msg => ({
    role: (msg.senderType === 'AI' || msg.sender_type === 'AI') ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.3,
      maxOutputTokens: 600
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error('Empty response received from Gemini API');
  }

  return JSON.parse(text);
}

module.exports = { askGemini };

