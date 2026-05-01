# Project Memory: Agent Glass-Box Observability

## Objective
Establish a persistent, real-time "Glass-Box" observability bridge between the open-source OpenClaw agent (powered by Gemini) and our Windows-based Agent-Debugger Next.js application.

## Core Milestones Achieved

### Phase 1: Stream Interception (The WSL Prototype)
- **Goal**: Read stdout/stderr without touching source code.
- **Action**: Built a monkey-patch over `dist/index.js` in the WSL installation to parse "Running tool" and "Thinking" strings.
- **Networking**: Configured Next.js to bind to `0.0.0.0` and successfully routed payloads across the WSL2 hypervisor boundary to Windows host IP `172.25.128.1`.
- **Limitation**: The output was limited to string parsing. We lacked deep JSON context of exactly what the agent sent to Gemini and received back.

### Phase 2: Native Telemetry Fork (The Glass-Box Evolution)
- **Goal**: Full, untruncated access to Gemini reasoning paths, tool inputs, and stdout context.
- **Action**: Forked OpenClaw directly to `C:\Users\Hitesh\Desktop\openclaw`.
- **Implementation**: Located the central execution pipeline in `src/infra/agent-events.ts` and injected a native `fetch` webhook inside `emitAgentEvent`.
- **Result**: Every thought (`reasoning`), tool decision (`tool_use`), lifecycle phase (`task_start`/`task_complete`), and `command_output` is now perfectly JSON formatted and streamed to `Agent-Debugger` synchronously with the agent's internal logic tree.

## Technical Architecture
- **Agent Frontend**: Windows-bound Next.js dashboard running on `:3000`.
- **Ingestion Server**: `src/app/api/ingest/route.ts` mapped to parse trace events.
- **Agent Engine**: Local fork of OpenClaw with native JSON webhooks.
- **Repository Setup**: Initialized `.git` root in `Agent-Debugger/web`, merged all files, and published to GitHub at `swapwarick/Agent-Glass-Box`.

## Future Improvements
- Add dedicated `agent-events.ts` payload typing to capture token usage and cost metrics to visualize directly on the dashboard.
- Create dynamic bounding boxes in the ReactFlow UI to group sub-agent calls under parent tasks.
