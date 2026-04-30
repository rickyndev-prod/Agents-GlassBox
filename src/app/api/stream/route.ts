import { NextRequest } from 'next/server';
import { subscriber } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trace_id = searchParams.get('trace_id');

  if (!trace_id) {
    return new Response('Missing trace_id parameter', { status: 400 });
  }

  const channel = `trace:${trace_id}`;

  const stream = new ReadableStream({
    async start(controller) {
      // Subscribe to the specific trace channel
      await subscriber.subscribe(channel, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${channel}:`, err);
          controller.error(err);
        }
      });

      const messageHandler = (ch: string, message: string) => {
        if (ch === channel) {
          try {
            // Send event to the client using SSE format
            controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
          } catch (e) {
             // Controller might be closed
          }
        }
      };

      subscriber.on('message', messageHandler);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`:\n\n`));
        } catch (e) {
          clearInterval(keepAlive);
        }
      }, 15000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        subscriber.unsubscribe(channel);
        subscriber.off('message', messageHandler);
        try { controller.close(); } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
