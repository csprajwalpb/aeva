import { withRetry, getGeminiModel, logServerError } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid message parameter.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Safe fallback title on local env if no API key is active
      const fallbackTitle = message.trim().slice(0, 30) + (message.length > 30 ? '...' : '');
      return new Response(JSON.stringify({ title: fallbackTitle }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = getGeminiModel(apiKey);
    const prompt = 
      'You are a helpful chat log utility. Your sole task is to generate a highly concise conversation title ' +
      'based on the following user message. The title MUST be between 2 and 4 words. ' +
      'Do NOT use quotation marks, punctuation, or wrapper texts. Keep it elegant, descriptive, and capitalize it correctly. ' +
      'Example Input: "How do I learn system design?" ' +
      'Example Output: Learning System Design\n\n' +
      `User Message: "${message}"`;

    // Attempt generation with 3x retry exponential backoff
    let title = '';
    try {
      const result = await withRetry(async () => {
        return await model.generateContent(prompt);
      });
      title = result.response.text().trim();
    } catch (apiError) {
      // Log title-specific errors only in dev mode
      logServerError('Failed to generate title from Gemini API, falling back to slice', apiError);
      
      // Safe fallback - prevents chat crashing when API is unavailable
      title = message.trim().slice(0, 25) + (message.length > 25 ? '...' : '');
    }

    // Clean up any potential quotation marks that the AI might have accidentally added
    title = title.replace(/^["']|["']$/g, '').trim();
    if (title.endsWith('.')) {
      title = title.slice(0, -1);
    }

    // Safety fallback if response is empty
    if (!title) {
      title = message.trim().slice(0, 25) + (message.length > 25 ? '...' : '');
    }

    return new Response(JSON.stringify({ title }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logServerError('Crash in title endpoint handler', error);
    // Guarantee fallback response even on total endpoint failure
    return new Response(JSON.stringify({ title: 'New Conversation' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
