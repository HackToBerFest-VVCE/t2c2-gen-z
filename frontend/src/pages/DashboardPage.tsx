import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ClipboardCheck, 
  Cpu, 
  CloudUpload, 
  ShieldCheck, 
  Play, 
  Sparkles, 
  ArrowRight, 
  Droplet, 
  Sprout, 
  HeartPulse, 
  Building2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { db } from '../db';
import { TaskCard } from '../components/TaskCard';
import { ResourceWidget } from '../components/ResourceWidget';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { AgentExecutionVisualizer } from '../components/AgentExecutionVisualizer';
import { agentRunner } from '../agent/runner';
import type { TaskRecord } from '../types';
import type { AgentExecutionTraceStep } from '../agent/types';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoTraceSteps, setDemoTraceSteps] = useState<AgentExecutionTraceStep[]>([]);
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Reactive IndexedDB queries
  const tasks = useLiveQuery(() => db.tasks.orderBy('created_at').reverse().toArray()) || [];
  const outboxItems = useLiveQuery(() => db.syncOutbox.toArray()) || [];

  const totalTasks = tasks.length;
  const localCompleted = tasks.filter(t => t.status === 'completed_local').length;
  const awaitingSync = outboxItems.filter(o => o.status === 'pending').length;
  const verifiedCount = tasks.filter(t => t.verified_evidence).length;
  const conflictsCount = tasks.filter(t => t.status === 'conflict').length;

  // Run the default benchmark scenario: Village Hand Pump Failure
  const runDefaultDemo = async () => {
    setIsDemoRunning(true);
    setShowVisualizer(true);
    setDemoTraceSteps([]);

    const demoTaskId = `task-handpump-${Date.now()}`;
    const initialTask: TaskRecord = {
      id: demoTaskId,
      title: 'Village Primary School Hand Pump Breakdown',
      description: 'The hand pump near the village primary school has stopped working. Around 40 families depend on it.',
      category: 'water_supply',
      priority: 'medium',
      status: 'queued',
      location: 'Near Village Primary School, Sector 2',
      affected_population: 40,
      confidence_score: 0.0,
      verified_evidence: false,
      device_id: 'node-field-01',
      revision: 1,
      client_updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.tasks.put(initialTask);

    try {
      const completedTask = await agentRunner.runSingleTask(initialTask, (step) => {
        setDemoTraceSteps(prev => [...prev, step]);
      });
      setSelectedTask(completedTask);
    } finally {
      setIsDemoRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero / Quick Action Banner */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-cyan-950/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Offline-First Autonomous Engine</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Autonomous Field Operations Without Reliable Internet
            </h1>
            
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              FieldPilot executes lightweight, grounded AI agents locally on rural field devices, generates civic action plans, manages device power & storage, and synchronizes verified results when connectivity returns.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={runDefaultDemo}
              disabled={isDemoRunning}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isDemoRunning ? 'Executing Heuristic Agent...' : 'Run Benchmark Demo'}</span>
            </button>

            <button
              onClick={() => onNavigate('new')}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              <span>Create Custom Task</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Tasks</span>
            <ClipboardCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{totalTasks}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across all field categories</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Completed Locally</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">{localCompleted}</div>
          <p className="text-[11px] text-slate-400 mt-1">Processed 100% on-device</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Awaiting Sync (Outbox)</span>
            <CloudUpload className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">{awaitingSync}</div>
          <p className="text-[11px] text-slate-400 mt-1">Queued for server reconnect</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Verified Evidence</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {verifiedCount} <span className="text-xs text-slate-400 font-normal">({totalTasks > 0 ? Math.round((verifiedCount/totalTasks)*100) : 0}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Audited physical inspections</p>
        </div>

      </div>

      {/* Real-time Agent Execution Visualizer (shows during demo or custom runs) */}
      {showVisualizer && demoTraceSteps.length > 0 && (
        <AgentExecutionVisualizer
          steps={demoTraceSteps}
          isRunning={isDemoRunning}
          onClose={() => setShowVisualizer(false)}
        />
      )}

      {/* Device Resource Governance Widget */}
      <ResourceWidget />

      {/* Recent Field Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Field Reports & Directives</h2>
            <p className="text-xs text-slate-400">Offline-capable tasks stored in IndexedDB</p>
          </div>
          
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>View All Tasks ({totalTasks})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.slice(0, 6).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No tasks created yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Run the benchmark demo or create a new field report to test the on-device AI runtime.
            </p>
            <button
              onClick={runDefaultDemo}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Run Hand Pump Demo
            </button>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            db.tasks.get(selectedTask.id).then(t => { if (t) setSelectedTask(t); });
          }}
        />
      )}

    </div>
  );
};
