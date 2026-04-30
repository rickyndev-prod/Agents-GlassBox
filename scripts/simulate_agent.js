// using native fetch

const API_URL = 'http://localhost:3000/api/ingest';
const TRACE_ID = 'demo-trace';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendEvent(event) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (!res.ok) console.error('Failed to send:', await res.text());
    else console.log(`Sent: ${event.event_type} (${event.span_id})`);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

async function runSimulation() {
  console.log('Starting Agent Simulation...');

  // 1. Planning Step
  const planSpanId = 'span_plan_001';
  await sendEvent({
    trace_id: TRACE_ID,
    span_id: planSpanId,
    parent_span_id: null,
    event_type: 'agent_plan',
    context_payload: { objective: 'Calculate payroll for user john_doe' }
  });
  await sleep(2000);

  // 2. Fetch User Data
  const fetchUserSpanId = 'span_tool_fetch_001';
  await sendEvent({
    trace_id: TRACE_ID,
    span_id: fetchUserSpanId,
    parent_span_id: planSpanId,
    event_type: 'tool_call',
    context_payload: { tool: 'getUserData', args: { username: 'john_doe' } }
  });
  await sleep(1500);

  // 3. Tool Result
  await sendEvent({
    trace_id: TRACE_ID,
    span_id: 'span_tool_res_001',
    parent_span_id: fetchUserSpanId,
    event_type: 'tool_result',
    context_payload: { result: { id: 123, role: 'engineer', base_salary: 100000 } }
  });
  await sleep(2000);

  // 4. LLM Generation
  const llmSpanId = 'span_llm_001';
  await sendEvent({
    trace_id: TRACE_ID,
    span_id: llmSpanId,
    parent_span_id: planSpanId,
    event_type: 'llm_generation',
    context_payload: { prompt: 'Calculate monthly salary for base 100000', model: 'gpt-4' }
  });
  await sleep(3000);

  // 5. LLM Result
  await sendEvent({
    trace_id: TRACE_ID,
    span_id: 'span_llm_res_001',
    parent_span_id: llmSpanId,
    event_type: 'llm_result',
    context_payload: { completion: 'Monthly salary is 8333.33' }
  });

  console.log('Simulation complete.');
}

runSimulation();
