# OpenClaw Telemetry Integration (WSL to Windows)

This document provides a step-by-step guide to intercepting live execution logs from the open-source AI agent (OpenClaw) running inside WSL (Ubuntu), and streaming them securely to a Next.js observability platform running on the Windows host.

## Architectural Overview
While OpenClaw is fully open-source (utilizing models like Google Gemini 3 Pro Preview or Flash), its native plugin architecture does not currently expose its internal LLM reasoning and system tools over an open webhook. To achieve "Glass-Box" observability without maintaining a custom fork of the repository, we employ a **Semantic Stream Interceptor** on the standard installation.

We inject a parser directly into Node.js's global `process.stdout` and `process.stderr` streams at the top of OpenClaw's entry point. This parser reconstructs the internal state into a hierarchical tree (`task_start` -> `tool_use` -> `task_complete`) and pushes it via `fetch` over the virtual network boundary to the Windows Host.

---

## Step 1: Finding the Windows Host IP
To allow WSL to talk to the Windows Next.js server, you cannot use `localhost` or `127.0.0.1`. You must find the IP address of the virtual `vEthernet (WSL)` adapter.

1. **Inside WSL**, you can usually find it by running:
   ```bash
   ip route | grep default | awk '{print $3}'
   ```
2. **On Windows**, run `ipconfig` and look for `vEthernet (WSL)`. 

*(In our configuration, the correct IP was `172.25.128.1`)*.

---

## Step 2: Bind Next.js to the Network
By default, Next.js only listens to the local loopback (`127.0.0.1`). We must configure it to listen to `0.0.0.0` so it accepts traffic from the WSL subnet.

Update your `package.json` in the Agent-Debugger project:
```json
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "build": "next build",
    "start": "next start"
  }
```

---

## Step 3: Injecting the Semantic Stream Interceptor
Find the compiled entry point of OpenClaw. If installed globally via `npm` or `fnm`, it will be located here:
`~/.local/share/fnm/node-versions/v22.22.0/installation/lib/node_modules/openclaw/dist/index.js`

At the **very top** of `index.js`, paste the following patch. 
*(Ensure you update the IP address in the `fetch` command to match your Windows Host IP from Step 1).*

```javascript
// --- START OPENCLAW OBSERVABILITY PATCH ---
try {
  let rootSpanId = null;
  let currentParentId = null;
  
  function processLogChunk(chunk, encoding, cb, isError) {
      const text = chunk ? chunk.toString() : "";
      // Ignore empty lines and prevent infinite recursion loops
      if (!text.trim() || text.includes("Agent-Debugger") || text.includes("172.25.128.1")) return;
      
      const lower = text.toLowerCase();
      let span_id = 'span_' + Date.now() + '_' + Math.floor(Math.random()*1000);
      let event_type = 'reasoning';
      let parent_span_id = null;

      // Stateful Tree Reconstruction
      if (!rootSpanId) {
          event_type = 'task_start';
          rootSpanId = span_id;
          currentParentId = span_id;
          parent_span_id = null;
      } else if (lower.includes('tool') || lower.includes('call') || lower.includes('schema')) {
          event_type = 'tool_use';
          parent_span_id = rootSpanId;
          currentParentId = span_id;
      } else if (lower.includes('result') || lower.includes('finish') || lower.includes('complete') || lower.includes('reply')) {
          event_type = 'task_complete';
          parent_span_id = currentParentId;
      } else {
          event_type = isError ? 'error' : 'reasoning';
          parent_span_id = currentParentId;
      }

      // Push telemetry over the WSL Bridge
      fetch('http://172.25.128.1:3000/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              trace_id: 'openclaw-live-session',
              span_id,
              parent_span_id,
              event_type,
              context_payload: { message: text.trim() }
          })
      }).catch(()=>{});
  }

  // Intercept Standard Output
  const origStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function(chunk, encoding, cb) {
      origStdoutWrite(chunk, encoding, cb);
      processLogChunk(chunk, encoding, cb, false);
  };

  // Intercept Error Output
  const origStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = function(chunk, encoding, cb) {
      origStderrWrite(chunk, encoding, cb);
      processLogChunk(chunk, encoding, cb, true);
  };
} catch(e) {}
// --- END OPENCLAW OBSERVABILITY PATCH ---
```

---

## Step 4: Restarting the OpenClaw Daemon
For the patch to take effect in the background service, you must forcefully restart the OpenClaw systemd daemon inside WSL:

```bash
systemctl --user restart openclaw-gateway.service || killall node
```

---

## Step 5: TraceViewer Resiliency
Ensure the frontend UI component handles connection drops natively.
In `src/components/TraceViewer.tsx`, ensure the `EventSource.onerror` callback **does not call `.close()`**. Omitting `.close()` allows the browser to automatically attempt reconnection when the backend server restarts.

```typescript
    eventSource.onerror = (err) => {
      console.error("EventSource connection lost. Attempting auto-reconnect...");
      // DO NOT call eventSource.close() here!
    };
```

---

## Limitations
OpenClaw is an open-source project. However, the standard installation pipes its internal LLM conversational thoughts directly to its native UI via WebSockets. The stream interceptor implemented above captures **100% of the terminal logs** (config warnings, tool schema snapshots, heartbeats, errors), but it cannot decrypt the WebSocket payload containing the raw LLM English output. To capture this deeper reasoning layer without losing updates, you can fork the open-source repository, inject a custom webhook directly into the Gemini generation pipeline, and build your own tailored release.
