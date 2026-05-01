const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const API_URL = 'http://127.0.0.1:3001/api/ingest';
const TRACE_ID = 'glass-box-test';

// Send telemetry event to the Glass-Box Dashboard
async function logToGlassBox(spanId, parentSpanId, eventType, payload) {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trace_id: TRACE_ID,
        span_id: spanId,
        parent_span_id: parentSpanId,
        event_type: eventType,
        context_payload: payload,
      })
    });
    console.log(`[Telemetry] Sent ${eventType} to dashboard`);
  } catch (e) {
    console.error('[Telemetry Error]:', e.message);
  }
}

async function runAgent() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Please export GEMINI_API_KEY before running this script.");
    process.exit(1);
  }

  const task = process.argv.slice(2).join(" ") || "Give me a quick 2 sentence poem about debugging.";
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  console.log(`Starting Glass-Box Agent for task: "${task}"`);

  // 1. Log Task Start
  const rootSpanId = `task-${Date.now()}`;
  await logToGlassBox(rootSpanId, null, 'task_start', { task });

  // 2. Log Reasoning (Sending to Gemini)
  const reasoningSpanId = `reasoning-${Date.now()}`;
  await logToGlassBox(reasoningSpanId, rootSpanId, 'reasoning', { 
    thought: "Analyzing the task and deciding how to fulfill the request using Gemini." 
  });

  try {
    // 3. Execute the actual LLM call
    const result = await model.generateContent(task);
    const text = result.response.text();

    // 4. Log Tool Use / LLM Result
    const toolSpanId = `tool_use-${Date.now()}`;
    await logToGlassBox(toolSpanId, reasoningSpanId, 'tool_use', { 
      tool: "Gemini_LLM", 
      output: text 
    });

    // 5. Log Task Complete
    const completeSpanId = `complete-${Date.now()}`;
    await logToGlassBox(completeSpanId, rootSpanId, 'task_complete', { 
      status: "success", 
      final_result: text 
    });

    console.log("\nAgent Output:\n" + text);

  } catch (error) {
    await logToGlassBox(`error-${Date.now()}`, rootSpanId, 'task_complete', { status: "failed", error: error.message });
    console.error("Agent failed:", error.message);
  }
}

runAgent();
