<div align="center">
  <br />
  <img src="https://img.icons8.com/nolan/128/network.png" alt="GlassBox Logo" width="100"/>
  <h1>Agents Glass-Box</h1>
  <p><strong>A Real-Time Observability & Telemetry Dashboard for AI Swarms</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](#)
  [![React Flow](https://img.shields.io/badge/React_Flow-UI-blue?style=for-the-badge)](#)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)

  <p>Bridge the "Debuggability Gap" and eliminate the AI Black Box.</p>
  
  <br />
  
  <img src="public/glassbox-demo.gif" alt="Agents Glass-Box Live Trace Demo" width="800" />
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

## 🚀 Full Installation & Usage Guide

### Step 1: Clone & Install
Clone the repository and install the dependencies:
```bash
git clone https://github.com/rickyndev-prod/Agents-GlassBox.git
cd Agents-GlassBox/web
npm install
```

### Step 2: Configure Environment Variables
Agents Glass-Box utilizes a dual-database architecture:
1. **Upstash Redis**: Used as a lightning-fast ephemeral message broker for live-streaming of real-time agent thoughts.
2. **PostgreSQL (Supabase)**: Used as persistent cold-storage to archive historical traces. This is essential so you can search past agent executions, analyze long-term swarm performance metrics, and maintain strict audit logs of LLM decisions after the live stream ends.

Create a `.env.local` file in the root of the project and add your credentials:
```env
# Ephemeral Queue (Upstash Redis)
KV_REST_API_READ_ONLY_TOKEN="your_read_only_token"
KV_REST_API_TOKEN="your_api_token"
KV_REST_API_URL="https://your-upstash-url.upstash.io"
KV_URL="rediss://default:your_token@your-upstash-url.upstash.io:6379"
KV_REDIS_URL="rediss://default:your_token@your-upstash-url.upstash.io:6379"

# Persistent Archive (Supabase PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

### Step 3: Launch the Dashboard
Start the Glass-Box development server. It is configured to run on Port `3001` so it doesn't conflict with your primary Next.js applications (which usually run on `3000`).
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3001`.

### Step 4: Instrument Your AI Agents
To stream telemetry from your external AI apps to Glass-Box, you must include the `glassbox.ts` SDK file in your main application (e.g., inside `src/lib/glassbox.ts`).

Once included, initialize the telemetry class using a unique Trace ID, and dispatch events natively from your agent code:

```typescript
import { GlassBoxTelemetry } from './lib/glassbox';

// 1. Initialize with a unique Trace ID (e.g. for a specific task or swarm)
const telemetry = new GlassBoxTelemetry('swarm-12345');

// 2. Track the Root Task starting
telemetry.taskStart('task-1', 'Evaluate Procurement Tender');

// 3. Track Agent Tool Execution
telemetry.toolCall('agent-node', 'task-1', 'Financial Risk Officer', { budget: '5M' });

// 4. Track Agent Reasoning or Thoughts
telemetry.reasoning('thought-node', 'agent-node', 'Concerns regarding budget liquidity.');

// 5. Track Final Agent Results
telemetry.toolResult('result-node', 'agent-node', 'VERDICT: REJECT');
```

### Step 5: Trace Execution Live
Once your instrumented swarm runs:
1. Grab the `Trace ID` (e.g., `swarm-12345`).
2. Type it into the search bar at the top of your Glass-Box Dashboard (`http://localhost:3001`).
3. Press **Enter**.
4. The React Flow graph will build the Swarm's entire logic tree, color-coded and hierarchical, in real-time!

<br />

## 🛠️ Architecture

- **Frontend**: Next.js (App Router), TailwindCSS, React Flow (Graph UI).
- **Ingestion API**: A specialized Next.js route handler (`/api/ingest`) utilizing a dual-pipeline:
  - **Upstash Redis Streams** for lightning-fast ephemeral event broadcasting.
  - **Supabase PostgreSQL** for long-term historical tracing and audit compliance.
- **Layout Engine**: Dagre.js for dynamic, conflict-free directional graph layouts (Left-to-Right).

<br />

## 🔒 Privacy & Security

Agents Glass-Box is designed to run **locally** alongside your primary applications. Telemetry is streamed over localhost (`127.0.0.1`), ensuring sensitive LLM data, API keys, and proprietary business logic never leave your development environment.

<hr />
<div align="center">
  <p>Built with ❤️ for true Agentic Observability.</p>
</div>
