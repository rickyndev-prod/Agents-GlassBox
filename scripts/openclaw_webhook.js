/**
 * OpenClaw -> Agent-Debugger Bridge
 * 
 * Drop this logic into your OpenClaw extension or logging hook.
 * It will capture OpenClaw's internal events and stream them to your visual debugger!
 */

const DEBUGGER_INGEST_URL = 'http://localhost:3000/api/ingest';
const TRACE_ID = 'openclaw-live-session';

// This function takes an OpenClaw event and formats it for the visual debugger
async function forwardToDebugger(openclawEvent) {
  // Map OpenClaw's internal event types to the Debugger's expected types
  let eventType = 'llm_generation';
  let spanId = `span_${Date.now()}`;
  let payload = {};

  if (openclawEvent.type === 'tool_execution') {
    eventType = 'tool_call';
    payload = { tool: openclawEvent.toolName, args: openclawEvent.args };
  } else if (openclawEvent.type === 'llm_response') {
    eventType = 'llm_result';
    payload = { completion: openclawEvent.text };
  } else if (openclawEvent.type === 'planning') {
    eventType = 'agent_plan';
    payload = { objective: openclawEvent.thought };
  }

  try {
    await fetch(DEBUGGER_INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trace_id: TRACE_ID,
        span_id: spanId,
        parent_span_id: null, // Set this if you want to nest tool calls under plans!
        event_type: eventType,
        context_payload: payload,
      })
    });
  } catch (err) {
    console.error('Failed to send to debugger:', err.message);
  }
}

// Example of how you would hook this into OpenClaw:
/*
  openclaw.on('agent:thought', (event) => forwardToDebugger(event));
  openclaw.on('agent:tool', (event) => forwardToDebugger(event));
*/
