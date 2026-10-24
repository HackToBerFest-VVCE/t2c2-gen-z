import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Cpu, Zap, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import type { AgentExecutionTraceStep } from '../agent/types';

interface AgentExecutionVisualizerProps {
  steps: AgentExecutionTraceStep[];
  isRunning: boolean;
  onClose?: () => void;
}

export const AgentExecutionVisualizer: React.FC<AgentExecutionVisualizerProps> = ({
  steps,
  isRunning,
  onClose
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30 bg-slate-900/95 shadow-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <span>Local Autonomous Agent Trace</span>
              {isRunning && (
                <span className="flex items-center space-x-1 text-[11px] text-cyan-400 font-mono font-normal animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Client-Side...</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">Zero cloud calls • Real-time deterministic neural heuristic pipeline</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Step by step pipeline */}
      <div className="mt-4 space-y-3">
        {steps.map((step, idx) => (
          <div 
            key={idx}
            className={`p-3 rounded-xl border transition-all text-xs ${
              step.status === 'completed'
                ? 'bg-slate-800/40 border-slate-700/60 text-slate-200'
                : step.status === 'running'
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200 animate-pulse'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2 font-medium">
                {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {step.status === 'running' && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
                {step.status === 'failed' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span className="text-white font-semibold">Step {step.step}: {step.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {new Date(step.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] pl-6 leading-relaxed font-mono">
              {step.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
