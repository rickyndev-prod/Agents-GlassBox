import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { publisher } from '@/lib/redis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trace_id, span_id, parent_span_id, event_type, context_payload, timestamp } = body;

    if (!trace_id || !span_id || !event_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Insert into PostgreSQL
    // Create a table if not exists (in a real app, do this via migrations)
    await query(`
      CREATE TABLE IF NOT EXISTS agent_events (
        id SERIAL PRIMARY KEY,
        trace_id VARCHAR(255) NOT NULL,
        span_id VARCHAR(255) NOT NULL,
        parent_span_id VARCHAR(255),
        event_type VARCHAR(255) NOT NULL,
        context_payload JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(
      `INSERT INTO agent_events (trace_id, span_id, parent_span_id, event_type, context_payload, timestamp) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        trace_id, 
        span_id, 
        parent_span_id || null, 
        event_type, 
        JSON.stringify(context_payload || {}), 
        timestamp ? new Date(timestamp) : new Date()
      ]
    );

    // 2. Publish to Redis for real-time streaming
    const channel = `trace:${trace_id}`;
    await publisher.publish(channel, JSON.stringify({
      trace_id,
      span_id,
      parent_span_id,
      event_type,
      context_payload,
      timestamp: timestamp || new Date().toISOString()
    }));

    return NextResponse.json({ success: true, message: 'Event ingested' });
  } catch (error) {
    console.error('Error ingesting event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
