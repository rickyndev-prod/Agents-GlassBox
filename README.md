<div align="center">
  <br />
  <img src="https://img.icons8.com/nolan/128/network.png" alt="GlassBox Logo" width="100"/>
  <h1>Agents Glass-Box</h1>
  <p><strong>A Real-Time Observability & Telemetry Dashboard for AI Swarms</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](#)
  [![React Flow](https://img.shields.io/badge/React_Flow-UI-blue?style=for-the-badge)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)

  <p>Bridge the "Debuggability Gap" and eliminate the AI Black Box.</p>
</div>

<br />

## 🌟 Overview

As AI agents scale from single-shot tasks to massive, deliberating swarms (like our 32-agent Tender evaluation committee), traditional console logging becomes impossible to track. 

**Agents Glass-Box** is a localized telemetry engine and visual dashboard that automatically intercepts agent thought-processes, network requests, tool usages, and consensus votes—rendering them as an interactive, real-time logic tree.

<br />

## ✨ Key Features

- **Real-Time Trace Streaming**: Powered by Server-Sent Events (SSE) to visualize agent logic the millisecond it executes.
- **Hierarchical Node Rendering**: Built on top of React Flow & Dagre to elegantly map deep deliberation chains (Task -> Agent -> Reasoning -> Result).
- **Universal SDK**: A zero-dependency telemetry class (`GlassBoxTelemetry`) that can be dropped into any Node.js/TypeScript AI project.
- **Span Inspector**: Click on any node in the tree to inspect raw JSON context payloads, LLM arguments, and latency metrics.
- **Color-Coded Semantics**: Visual distinction between Task initializations (🎯), Tool Executions (🛠️), Abstract Reasoning (🧠), and Final Determinations (✅).

<br />

## 🚀 Getting Started

### 1. Launch the Glass-Box Dashboard
Clone the repository and spin up the visualizer on its dedicated port:
```bash
npm install
npm run dev
# The dashboard will automatically bind to http://localhost:3001
```

### 2. Instrument Your AI Agents
Drop the `glassbox.ts` SDK into your primary AI application. Initialize it using a unique Trace ID, and dispatch events:
```typescript
import { GlassBoxTelemetry } from './lib/glassbox';

const telemetry = new GlassBoxTelemetry('swarm-12345');

// Track Root Task
telemetry.taskStart('task-1', 'Evaluate Procurement Tender');

// Track Agent Tool Use
telemetry.toolCall('agent-node', 'task-1', 'Financial Risk Officer', { budget: '5M' });

// Track Agent Reasoning
telemetry.reasoning('thought-node', 'agent-node', 'Concerns regarding budget liquidity.');
```

### 3. Trace Execution
Once your swarm executes, grab the `Trace ID` printed in your terminal and drop it into the search bar at `http://localhost:3001`. The swarm will construct itself visually in real time.

<br />

## 🛠️ Architecture

- **Frontend**: Next.js (App Router), TailwindCSS, React Flow (Graph UI).
- **Ingestion API**: A specialized Next.js route handler (`/api/ingest`) utilizing Upstash Redis Streams for lightning-fast ephemeral event queuing.
- **Layout Engine**: Dagre.js for dynamic, conflict-free directional graph layouts (Left-to-Right).

<br />

## 🔒 Privacy & Security

Agents Glass-Box is designed to run **locally** alongside your primary applications. Telemetry is streamed over localhost (`127.0.0.1`), ensuring sensitive LLM data, API keys, and proprietary business logic never leave your development environment.

<hr />
<div align="center">
  <p>Built with ❤️ for true Agentic Observability.</p>
</div>
