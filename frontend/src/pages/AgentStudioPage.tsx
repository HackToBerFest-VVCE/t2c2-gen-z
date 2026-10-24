import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Cpu, 
  Battery, 
  HardDrive, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  RotateCcw,
  Sparkles,
  Server
} from 'lucide-react';
import { agentRunner } from '../agent/runner';
import { ollamaAgent } from '../agent/ollama';
import { resourceManager, type ResourceStatus } from '../services/resourceManager';
import { db, initializeDatabase } from '../db';
import { AgentExecutionVisualizer } from '../components/AgentExecutionVisualizer';
import type { AgentExecutionTraceStep } from '../agent/types';
import type { AgentOutput } from '../types';

export const AgentStudioPage: React.FC = () => {
  const [provider, setProvider] = useState<'deterministic' | 'ollama'>('deterministic');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [isCheckingOllama, setIsCheckingOllama] = useState(false);

  const [resources, setResources] = useState<ResourceStatus>(resourceManager.getStatus());
  const [testInput, setTestInput] = useState('Primary school solar inverter broken. Around 35 students and 10 teachers without fan and drinking water filter.');
  const [isTesting, setIsTesting] = useState(false);
  const [testTrace, setTestTrace] = useState<AgentExecutionTraceStep[]>([]);
  const [testResult, setTestResult] = useState<AgentOutput | null>(null);

  useEffect(() => {
    return resourceManager.subscribe(s => setResources(s));
  }, []);

  const handleProviderChange = (newProvider: 'deterministic' | 'ollama') => {
    setProvider(newProvider);
    agentRunner.setProvider(newProvider);
  };

  const checkOllamaStatus = async () => {
    setIsCheckingOllama(true);
    ollamaAgent.endpoint = ollamaEndpoint;
    ollamaAgent.model = ollamaModel;
    const avail = await ollamaAgent.isAvailable();
    setOllamaAvailable(avail);
    setIsCheckingOllama(false);
  };

  const runSandboxInference = async () => {
    setIsTesting(true);
    setTestTrace([]);
    setTestResult(null);

    try {
      const activeP = agentRunner.getProvider();
      const res = await activeP.processTask(testInput, {}, (step) => {
        setTestTrace(prev => [...prev, step]);
      });
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const resetAndReSeed = async () => {
    if (confirm('Re-seed initial benchmark demonstration data in IndexedDB?')) {
      await db.tasks.clear();
      await db.syncOutbox.clear();
      await db.auditLogs.clear();
      await initializeDatabase();
      alert('IndexedDB reset and seeded with benchmark demo task!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Agent Runtime & Hardware Governance
        </h1>
        <p className="text-xs text-slate-400">
          Configure local AI inference engines, battery saver thresholds, and test the offline NLP sandbox.
        </p>
      </div>

      {/* Model Provider Selection */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Pluggable Local Model Provider</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Provider 1: Deterministic Engine */}
          <div
            onClick={() => handleProviderChange('deterministic')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              provider === 'deterministic'
                ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>Deterministic Heuristic Engine</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                  Default
                </span>
              </span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                provider === 'deterministic' ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'
              }`}>
                {provider === 'deterministic' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Zero dependencies, 100% offline, deterministic rule-based NLP parser. Extracts entities, calculates population impact, and plans field actions without cloud API or LLM download.
            </p>
            <div className="mt-3 flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
              <span>Latency: ~35ms</span>
              <span>Power: 0.04 mWh</span>
              <span className="text-emerald-400">Status: Ready</span>
            </div>
          </div>

          {/* Provider 2: Ollama Local LLM */}
          <div
            onClick={() => handleProviderChange('ollama')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              provider === 'ollama'
                ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>Ollama Local Model</span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">
                  Optional
                </span>
              </span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                provider === 'ollama' ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'
              }`}>
                {provider === 'ollama' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect to local on-device LLMs (Llama 3.2, Phi 3, TinyLlama) via standard Ollama port. Automatically falls back to deterministic engine if offline.
            </p>
            <div className="mt-3 flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
              <span>Port: 11434</span>
              <span>Model: {ollamaModel}</span>
              <span className={ollamaAvailable ? 'text-emerald-400' : 'text-slate-500'}>
                {ollamaAvailable === true ? 'Connected' : ollamaAvailable === false ? 'Unreachable' : 'Untested'}
              </span>
            </div>
          </div>

        </div>

        {/* Ollama Configuration Inputs if selected */}
        {provider === 'ollama' && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Ollama API Base URL:</label>
                <input
                  type="text"
                  value={ollamaEndpoint}
                  onChange={(e) => setOllamaEndpoint(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Model Tag:</label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <button
              onClick={checkOllamaStatus}
              disabled={isCheckingOllama}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium"
            >
              {isCheckingOllama ? 'Pinging Ollama...' : 'Test Ollama Connection'}
            </button>
          </div>
        )}
      </div>

      {/* Hardware Resource Settings */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Battery className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Power & Storage Governance</h3>
        </div>

        <div className="space-y-4 text-xs">
          
          {/* Low Battery Saver Threshold */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-300 font-medium">Low Battery Auto-Throttling Threshold:</span>
              <span className="font-mono font-bold text-emerald-400">
                {Math.round(resources.batteryThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              value={Math.round(resources.batteryThreshold * 100)}
              onChange={(e) => resourceManager.setBatteryThreshold(parseInt(e.target.value) / 100)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              When battery falls below this threshold and device is not charging, background agent batches are deferred to preserve device life.
            </p>
          </div>

          {/* Storage & Database Reset */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-300 font-semibold block">IndexedDB Benchmark Data Reset</span>
              <span className="text-[11px] text-slate-400">
                Wipe local tasks and re-seed the default verified benchmark report.
              </span>
            </div>
            <button
              onClick={resetAndReSeed}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 border border-slate-700 font-medium flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset & Re-seed</span>
            </button>
          </div>

        </div>
      </div>

      {/* Interactive Agent Sandbox */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Local Agent Sandbox Tester</h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Test Incident Text:
          </label>
          <textarea
            rows={3}
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={runSandboxInference}
          disabled={isTesting || !testInput.trim()}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-emerald-500/20"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isTesting ? 'Running Heuristics...' : 'Run Local Inference Test'}</span>
        </button>

        {testTrace.length > 0 && (
          <AgentExecutionVisualizer
            steps={testTrace}
            isRunning={isTesting}
          />
        )}

        {testResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-emerald-400 font-bold pb-2 border-b border-slate-800">
              <span>Inference Result (Latency: {testResult.processing_time_ms} ms)</span>
              <span>Category: {testResult.category} | Priority: {testResult.priority}</span>
            </div>
            <pre className="text-slate-300 text-[11px] overflow-x-auto max-h-60">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

    </div>
  );
};
