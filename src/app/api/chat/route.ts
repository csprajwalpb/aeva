import { withRetry, getGeminiModel, logServerError, getFriendlyErrorMessage } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing messages array.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuration Error: The Gemini API Key is not configured on the server. Please define GEMINI_API_KEY in your env.' 
        }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const systemInstruction = 
      'You are Aeva, a highly sophisticated, brilliant, and helpful conversational AI coding assistant. ' +
      'Your user interface is designed with a premium, futuristic Deep Obsidian dark theme. ' +
      'Always format your replies cleanly in high-quality Markdown. ' +
      'Provide elegant, production-grade code snippets whenever asked, explaining key choices and architectures concisely. ' +
      'Maintain a professional, wise, yet approachable tone.';

    const model = getGeminiModel(apiKey, systemInstruction);

    // Format messages for Gemini SDK: expects { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = messages
      .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    if (contents.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid user or assistant messages found.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Trigger Stream Generation with Exponential Backoff Retry (Up to 3 times for 429/503)
    const geminiStream = await withRetry(async () => {
      return await model.generateContentStream({ contents });
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of geminiStream.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err: any) {
          logServerError('Stream processing error mid-generation', err);
          controller.error(err);
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    logServerError('Failed to initiate Gemini streaming', error);
    const friendlyMsg = getFriendlyErrorMessage(error);
    
    return new Response(
      JSON.stringify({ 
        error: friendlyMsg,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      }), 
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
