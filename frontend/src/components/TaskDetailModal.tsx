import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  Circle, 
  Cpu, 
  Clock, 
  CloudCheck, 
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Sparkles,
  Check
} from 'lucide-react';
import type { TaskRecord, AgentActionItem } from '../types';
import { getCategoryBadge } from './TaskCard';
import { db } from '../db';
import { agentRunner } from '../agent/runner';
import { evaluateTaskPriority } from '../services/priorityAssistant';
import { syncManager } from '../services/syncManager';

interface TaskDetailModalProps {
  task: TaskRecord;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onTaskUpdated
}) => {
  const [currentTask, setCurrentTask] = useState<TaskRecord>(task);
  const [isReRunning, setIsReRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'reasoning' | 'metadata'>('actions');

  const priorityEval = evaluateTaskPriority(currentTask);

  const toggleActionItem = async (actionId: string) => {
    if (!currentTask.agent_output?.actions) return;
    const updatedActions = currentTask.agent_output.actions.map(act => {
      if (act.id === actionId) {
        return { ...act, completed: !act.completed };
      }
      return act;
    });

    const updatedTask: TaskRecord = {
      ...currentTask,
      agent_output: {
        ...currentTask.agent_output,
        actions: updatedActions
      },
      revision: (currentTask.revision || 1) + 1,
      client_updated_at: new Date().toISOString()
    };

    setCurrentTask(updatedTask);
    await db.tasks.put(updatedTask);
    // Queue update in persistent outbox via idempotent syncManager
    await syncManager.enqueueOperation(updatedTask.id, 'update', updatedTask);
    if (onTaskUpdated) onTaskUpdated();
  };

  const toggleEvidenceVerification = async () => {
    const newEvidenceStatus = !currentTask.verified_evidence;
    const updatedTask: TaskRecord = {
      ...currentTask,
      verified_evidence: newEvidenceStatus,
      revision: (currentTask.revision || 1) + 1,
      client_updated_at: new Date().toISOString()
    };

    setCurrentTask(updatedTask);
    await db.tasks.put(updatedTask);
    await syncManager.enqueueOperation(updatedTask.id, 'update', updatedTask);

    await db.auditLogs.add({
      id: `audit-verify-${updatedTask.id}-${Date.now()}`,
      task_id: updatedTask.id,
      action: newEvidenceStatus ? 'evidence_verified_by_human' : 'evidence_verification_revoked',
      actor: 'field_officer',
      details: newEvidenceStatus 
        ? 'Physical field evidence confirmed and certified.' 
        : 'Evidence certification revoked.',
      timestamp: new Date().toISOString()
    });

    if (onTaskUpdated) onTaskUpdated();
  };

  const reRunAgent = async () => {
    setIsReRunning(true);
    try {
      const refreshed = await agentRunner.runSingleTask(currentTask);
      setCurrentTask(refreshed);
      if (onTaskUpdated) onTaskUpdated();
    } finally {
      setIsReRunning(false);
    }
  };

  const output = currentTask.agent_output;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700/80 bg-slate-900/95 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {getCategoryBadge(currentTask.category)}
              <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                currentTask.priority === 'critical'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : currentTask.priority === 'high'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
              }`}>
                {currentTask.priority} Priority
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Rev {currentTask.revision} • Node: {currentTask.device_id}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">
              {currentTask.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header meta bar */}
        <div className="px-5 py-3 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center space-x-4">
            {currentTask.location && (
              <span className="flex items-center space-x-1.5 text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentTask.location}</span>
              </span>
            )}
            {currentTask.affected_population > 0 && (
              <span className="flex items-center space-x-1.5 text-slate-200 font-mono">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>~{currentTask.affected_population} affected</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={reRunAgent}
              disabled={isReRunning}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReRunning ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isReRunning ? 'Analyzing...' : 'Re-run Agent'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'actions'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Directives & Action Items ({output?.actions.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('reasoning')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'reasoning'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Agent Reasoning & Guardrails
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'metadata'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Field Telemetry & Raw Payload
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Smart Task Priority Assistant Panel */}
          <div className="p-4 rounded-xl border bg-slate-900/90 border-slate-750 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Smart Task Priority Assistant
                </h4>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  priorityEval.priority === 'HIGH'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : priorityEval.priority === 'MEDIUM'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  {priorityEval.priority} Priority ({priorityEval.score}/100)
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span>Urgency Grade:</span>
                <span className={`font-bold uppercase ${
                  priorityEval.urgencyLevel === 'immediate' ? 'text-rose-400' :
                  priorityEval.urgencyLevel === 'high' ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {priorityEval.urgencyLevel}
                </span>
              </div>
            </div>

            {/* Urgency Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  priorityEval.priority === 'HIGH' ? 'bg-gradient-to-r from-amber-500 to-rose-500' :
                  priorityEval.priority === 'MEDIUM' ? 'bg-gradient-to-r from-cyan-500 to-amber-500' :
                  'bg-gradient-to-r from-emerald-500 to-cyan-500'
                }`}
                style={{ width: `${priorityEval.score}%` }}
              />
            </div>

            {/* Reason & Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Deterministic Classification Reason
                </span>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {priorityEval.reason}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block mb-1">
                  Practical Suggested Next Action
                </span>
                <p className="text-emerald-200 text-xs leading-relaxed">
                  {priorityEval.suggestedAction}
                </p>
              </div>
            </div>

            {/* Rule Factors */}
            {priorityEval.factors.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                  Rule Evaluation Factors:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {priorityEval.factors.map((factor, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/60 text-[10px] text-slate-300 font-mono"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Field Incident Report
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              {currentTask.description}
            </p>
          </div>

          {/* TAB 1: ACTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Autonomous Action Directives (Check as executed):</span>
                <span>
                  {output?.actions.filter(a => a.completed).length || 0} of {output?.actions.length || 0} completed
                </span>
              </div>

              {output?.actions && output.actions.length > 0 ? (
                output.actions.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => toggleActionItem(act.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                      act.completed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      {act.completed ? (
                        <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-slate-950">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border border-slate-600 hover:border-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-xs font-semibold ${act.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                          {act.title}
                        </span>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                            {act.target_role}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            act.urgency === 'immediate'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {act.urgency}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {act.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No automated actions generated.</p>
              )}
            </div>
          )}

          {/* TAB 2: REASONING & GUARDRAILS */}
          {activeTab === 'reasoning' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-semibold text-white mb-2 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Agent Heuristic Chain of Thought</span>
                </h4>
                <div className="space-y-1.5 font-mono text-xs text-slate-300">
                  {output?.reasoning.map((r, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold shrink-0">[{i + 1}]</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Confidence Score</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {((output?.confidence_score || 0.9) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Processing Time</div>
                  <div className="text-sm font-bold font-mono text-cyan-400">
                    {output?.processing_time_ms || 32} ms
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Estimated Energy</div>
                  <div className="text-sm font-bold font-mono text-amber-400">
                    {output?.resource_cost_mwh || 0.04} mWh
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Agent Provider</div>
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {output?.model_name || 'Heuristic v1'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: METADATA & RAW PAYLOAD */}
          {activeTab === 'metadata' && (
            <div className="space-y-3">
              <pre className="p-3.5 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400/90 overflow-x-auto border border-slate-800 max-h-64">
                {JSON.stringify(currentTask, null, 2)}
              </pre>
            </div>
          )}

          {/* Human Evidence Verification Guardrail Box */}
          <div className={`p-4 rounded-xl border transition-all ${
            currentTask.verified_evidence 
              ? 'bg-emerald-950/20 border-emerald-500/40' 
              : 'bg-amber-950/20 border-amber-500/40'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-2.5">
                {currentTask.verified_evidence ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Physical Evidence Verification Protocol</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 font-mono text-slate-300">
                      Strict Guardrail
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {currentTask.verified_evidence
                      ? 'Verified on-site by field officer inspection signature. Evidence attached.'
                      : 'Unverified report. The autonomous agent is strictly forbidden from claiming repair completion without physical evidence.'}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleEvidenceVerification}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  currentTask.verified_evidence
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                }`}
              >
                {currentTask.verified_evidence ? 'Verified ✓' : 'Certify On-Site'}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Created: {new Date(currentTask.created_at).toLocaleString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
