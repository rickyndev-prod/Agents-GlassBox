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

      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          // Send event to the client using SSE format
          controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
        }
      });

      // Keep connection alive
      const keepAlive = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(`:\n\n`));
      }, 15000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        subscriber.unsubscribe(channel);
        controller.close();
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
