# OpenClaw Integration Session Log

## Objective
Establish a persistent, real-time observability telemetry bridge between the open-source OpenClaw agent (powered by Gemini) running in WSL, and the Windows-based Agent-Debugger Next.js application.

## Challenges Encountered & Resolutions

1. **Undocumented Plugin Architecture**
   - **Initial Attempt:** We attempted to use the official OpenClaw `hooks install` command by writing a custom hook plugin (`openclaw-debugger-hook`).
   - **Roadblock:** OpenClaw's plugin architecture relies on undocumented internal TypeScript schemas. The custom ESM module failed to execute properly due to restricted export environments and schema validation errors.
   - **Resolution:** Rather than creating and maintaining a custom fork of the open-source project, we opted for a system-level "Semantic Stream Interceptor" by monkey-patching `dist/index.js` on the standard installation.

2. **Cross-OS Networking**
   - **Initial Attempt:** We pushed telemetry to `localhost:3000` and `127.0.0.1:3000`. 
   - **Roadblock:** WSL2 runs in a lightweight VM with a different IP space than Windows. `localhost` from inside WSL does not resolve to the Windows host.
   - **Resolution:** We reconfigured the Next.js `package.json` to bind to `0.0.0.0`. Then, the agent AI (MAITRI) autonomously deduced the correct Windows Host IP (`172.25.128.1`) by scanning the virtual adapters and executed a successful test payload.

3. **Graph Rendering and Connectivity**
   - **Initial Attempt:** The first patch successfully streamed raw `stdout` strings to the UI, but they appeared as isolated floating nodes labeled `agent_log`.
   - **Roadblock:** The `simulate_agent.js` mock UI required perfect `parent_span_id` chains starting from a `task_start` root node to render the ReactFlow edges. Our raw dump lacked this hierarchy.
   - **Resolution:** We enhanced the patch with a stateful parser that inferred `event_type` from keywords, forced the first incoming log to spawn a `task_start` root node, and permanently attached all subsequent `tool_use` and `reasoning` logs to it.

4. **Missing Tool Output**
   - **Initial Attempt:** We noticed we were missing some tool execution context.
   - **Roadblock:** OpenClaw writes errors and some tool output to `process.stderr` instead of `process.stdout`.
   - **Resolution:** Expanded the patch to intercept both standard and error streams simultaneously.

## Final Result
A fully functioning, real-time "Glass-Box" observability bridge that maps OpenClaw's internal execution state into a hierarchical tree graph in the TraceViewer UI, bypassing the need to maintain a custom fork of the open-source platform.

