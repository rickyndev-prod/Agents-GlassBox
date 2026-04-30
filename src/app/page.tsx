'use client';

import React, { useState } from 'react';
import TraceViewer from '@/components/TraceViewer';

export default function Home() {
  const [traceId, setTraceId] = useState('');
  const [activeTrace, setActiveTrace] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (traceId.trim()) {
      setActiveTrace(traceId.trim());
    }
  };

  if (activeTrace) {
    return <TraceViewer traceId={activeTrace} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Debugger</h1>
          <p className="text-gray-500 mt-2">Connect to a live trace to view the agent's thought process.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="traceId" className="block text-sm font-medium text-gray-700 mb-1">
              Trace ID
            </label>
            <input
              type="text"
              id="traceId"
              value={traceId}
              onChange={(e) => setTraceId(e.target.value)}
              placeholder="e.g., trace_12345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Connect to Stream
          </button>
        </form>

        {/* Demo Button to quickly test */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => setActiveTrace('demo-trace')}
            className="text-sm text-indigo-600 hover:underline"
          >
            View Demo Trace (trace_id: demo-trace)
          </button>
        </div>
      </div>
    </div>
  );
}
