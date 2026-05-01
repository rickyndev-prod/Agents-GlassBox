'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Terminal, Network, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import dagre from 'dagre';

type TraceEvent = {
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  event_type: string;
  context_payload: any;
  timestamp: string;
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };

    newNode.targetPosition = isHorizontal ? Position.Left : Position.Top;
    newNode.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    newNode.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

export default function TraceViewer({ traceId }: { traceId: string }) {
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedEvent, setSelectedEvent] = useState<TraceEvent | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!traceId) return;

    const eventSource = new EventSource(`/api/stream?trace_id=${traceId}`);

    eventSource.onmessage = (e) => {
      try {
        const newEvent: TraceEvent = JSON.parse(e.data);
        
        setEvents((prev) => [...prev, newEvent]);

        // Add to graph
        setNodes((nds) => {
          let bgColor = '#fff';
          let borderColor = '#94a3b8';
          let titleColor = '#2563eb';
          let icon = '⚡';
          let title = newEvent.event_type.replace('_', ' ').toUpperCase();
          let subtext = newEvent.span_id.substring(0, 12);

          if (newEvent.event_type === 'task_start') {
            bgColor = '#f0fdf4'; borderColor = '#22c55e'; titleColor = '#16a34a'; icon = '🎯';
            subtext = 'Root Task';
          } else if (newEvent.event_type === 'tool_call') {
            bgColor = '#eff6ff'; borderColor = '#3b82f6'; titleColor = '#2563eb'; icon = '🛠️';
            if (newEvent.context_payload?.tool) subtext = newEvent.context_payload.tool;
          } else if (newEvent.event_type === 'reasoning') {
            bgColor = '#fefce8'; borderColor = '#eab308'; titleColor = '#ca8a04'; icon = '🧠';
            subtext = 'Agent Thinking';
          } else if (newEvent.event_type === 'tool_result' || newEvent.event_type === 'task_complete') {
            bgColor = '#fdf2f8'; borderColor = '#ec4899'; titleColor = '#db2777'; icon = '✅';
            subtext = 'Result Generated';
          }

          const newNode: Node = {
            id: newEvent.span_id,
            position: { x: 0, y: 0 },
            data: { 
              label: (
                <div className="flex flex-col items-start text-left w-full overflow-hidden">
                  <div className="font-bold flex items-center gap-1 mb-1 text-[11px] tracking-wide" style={{ color: titleColor }}>
                    <span>{icon}</span> {title}
                  </div>
                  <div className="text-gray-700 truncate w-full text-[13px] font-semibold">
                    {subtext}
                  </div>
                </div>
              ) 
            },
            style: { 
              border: `2px solid ${borderColor}`, 
              borderRadius: '8px',
              padding: '10px 14px',
              background: bgColor,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              width: 220,
            }
          };

          return [...nds, newNode];
        });

        if (newEvent.parent_span_id) {
          setEdges((eds) => [
            ...eds,
            {
              id: `e-${newEvent.parent_span_id}-${newEvent.span_id}`,
              source: newEvent.parent_span_id!,
              target: newEvent.span_id,
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2 }
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to parse event", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed, attempting to reconnect...", err);
    };

    return () => {
      eventSource.close();
    };
  }, [traceId, setNodes, setEdges]);

  // Apply layout whenever nodes or edges change in length
  useEffect(() => {
    if (nodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, 'LR');
      // Only set if they actually changed position to prevent infinite loops
      const hasChanged = layoutedNodes.some((node, i) => 
        node.position.x !== nodes[i].position.x || node.position.y !== nodes[i].position.y
      );
      if (hasChanged) {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      }
    }
  }, [nodes.length, edges.length, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    const ev = events.find(e => e.span_id === node.id);
    if (ev) setSelectedEvent(ev);
  }, [events]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Left Sidebar: Real-time Terminal Stream */}
      <div className={`${isSidebarOpen ? 'w-1/3' : 'w-0'} bg-gray-900 text-gray-100 flex flex-col border-r border-gray-700 transition-all duration-300 relative z-30 shrink-0`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white rounded-full p-1.5 shadow-lg z-50 hover:bg-indigo-500 transition-colors border border-indigo-400 flex items-center justify-center cursor-pointer"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Inner Content Wrapper */}
        <div className={`flex flex-col h-full w-full overflow-hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
          <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center space-x-2 shrink-0">
            <Terminal size={18} className="text-blue-400 shrink-0" />
            <h2 className="font-semibold text-sm tracking-wider uppercase whitespace-nowrap">Live Thought Stream</h2>
          </div>
        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-4 scroll-smooth">
          {events.length === 0 ? (
            <div className="text-gray-500 italic animate-pulse flex items-center gap-2">
              <Activity size={16} /> Waiting for agent events...
            </div>
          ) : (
            events.map((ev, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded-md border border-gray-700 shadow-sm transition-all hover:border-gray-500">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-700">
                  <span className="text-blue-400 font-bold">[{ev.event_type}]</span>
                  <span className="text-gray-500 text-xs">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-gray-300 break-words leading-relaxed text-xs">
                  {JSON.stringify(ev.context_payload).substring(0, 150)}
                  {JSON.stringify(ev.context_payload).length > 150 ? '...' : ''}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Main Content: Graph and Inspector */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-white border-b flex items-center px-6 shadow-sm z-10">
          <Network size={22} className="text-indigo-600 mr-3" />
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">Agent Glass-Box Debugger</h1>
          <div className="ml-auto flex items-center space-x-3 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Trace ID:</span>
            <span className="font-mono text-sm text-indigo-900">
              {traceId || 'Not connected'}
            </span>
          </div>
        </div>

        {/* Graph Area */}
        <div className="flex-1 relative bg-slate-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
          >
            <Controls />
            <MiniMap 
              nodeStrokeWidth={3} 
              nodeColor="#e2e8f0"
              maskColor="rgba(248, 250, 252, 0.7)"
            />
            <Background color="#cbd5e1" gap={16} />
          </ReactFlow>
        </div>

        {/* Bottom Panel: Context Inspector */}
        {selectedEvent && (
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white border-t border-gray-200 p-0 flex flex-col shadow-2xl z-20 transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wide">
                  <Activity size={16} className="mr-2 text-indigo-600" /> Span Inspector
                </h3>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="text-sm">
                  <span className="font-medium text-gray-500">Event:</span> 
                  <span className="ml-1 text-gray-800 font-semibold bg-gray-200 px-2 py-0.5 rounded text-xs">{selectedEvent.event_type}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-500">Span ID:</span> 
                  <span className="ml-1 font-mono text-gray-600 text-xs">{selectedEvent.span_id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-1 rounded transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white p-4 font-mono text-sm text-gray-800">
              <pre className="whitespace-pre-wrap leading-relaxed">{JSON.stringify(selectedEvent.context_payload, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
