import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  MapPin, 
  Users, 
  Droplet, 
  Sprout, 
  HeartPulse, 
  Building2, 
  Play, 
  Clock, 
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { db } from '../db';
import { agentRunner } from '../agent/runner';
import { AgentExecutionVisualizer } from '../components/AgentExecutionVisualizer';
import { TaskDetailModal } from '../components/TaskDetailModal';
import type { TaskRecord } from '../types';
import type { AgentExecutionTraceStep } from '../agent/types';

interface NewTaskPageProps {
  onNavigate: (tab: string) => void;
}

interface PresetDemo {
  label: string;
  category: string;
  icon: React.ReactNode;
  title: string;
  location: string;
  description: string;
  pop: number;
}

const PRESET_DEMOS: PresetDemo[] = [
  {
    label: 'Village Hand Pump Failure',
    category: 'Water Supply',
    icon: <Droplet className="w-4 h-4 text-cyan-400" />,
    title: 'Village Primary School Hand Pump Breakdown',
    location: 'Near Village Primary School, Sector 2',
    description: 'The hand pump near the village primary school has stopped working. Around 40 families depend on it.',
    pop: 40
  },
  {
    label: 'Paddy Crop Pest Outbreak',
    category: 'Agriculture',
    icon: <Sprout className="w-4 h-4 text-emerald-400" />,
    title: 'Stem Borer & Leaf Blast in Zone B Paddy Plots',
    location: 'Zone B North Canal Embankment',
    description: 'Severe stem borer insect infestation detected across paddy crop fields. Around 25 farming families face total crop loss.',
    pop: 25
  },
  {
    label: 'PHC Vaccine Solar Fridge Failure',
    category: 'Healthcare',
    icon: <HeartPulse className="w-4 h-4 text-rose-400" />,
    title: 'Primary Health Center Cold-Chain Refrigerator Outage',
    location: 'Sub-Center PHC, East Hamlet',
    description: 'The solar refrigerator inverter has tripped. Over 90 infant vaccine doses are stored inside and temperatures are rising.',
    pop: 90
  },
  {
    label: 'Road Culvert Storm Debris Blockage',
    category: 'Infrastructure',
    icon: <Building2 className="w-4 h-4 text-amber-400" />,
    title: 'Culvert Silt Blockage & Flash Flood Risk',
    location: 'North Access Road Culvert 4',
    description: 'Monsoon debris and tree limbs have blocked the main road drainage culvert. 50 families cut off from hospital route.',
    pop: 50
  }
];

export const NewTaskPage: React.FC<NewTaskPageProps> = ({ onNavigate }) => {
  const [title, setTitle] = useState('Village Primary School Hand Pump Breakdown');
  const [description, setDescription] = useState('The hand pump near the village primary school has stopped working. Around 40 families depend on it.');
  const [location, setLocation] = useState('Near Village Primary School, Sector 2');
  const [population, setPopulation] = useState<number>(40);
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [traceSteps, setTraceSteps] = useState<AgentExecutionTraceStep[]>([]);
  const [completedTask, setCompletedTask] = useState<TaskRecord | null>(null);

  const applyPreset = (preset: PresetDemo) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setLocation(preset.location);
    setPopulation(preset.pop);
  };

  const handleCreateAndExecute = async (executeNow: boolean) => {
    if (!description.trim()) return;

    setIsExecuting(true);
    setTraceSteps([]);

    const taskId = `task-${Date.now()}`;
    const initialTask: TaskRecord = {
      id: taskId,
      title: title.trim() || 'Field Incident Report',
      description: description.trim(),
      category: 'water_supply', // Agent will dynamically classify this
      priority: 'medium',
      status: executeNow ? 'queued' : 'draft',
      location: location.trim(),
      affected_population: Number(population) || 0,
      confidence_score: 0.0,
      verified_evidence: false,
      device_id: 'node-field-01',
      revision: 1,
      client_updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.tasks.put(initialTask);

    if (executeNow) {
      try {
        const processed = await agentRunner.runSingleTask(initialTask, (step) => {
          setTraceSteps(prev => [...prev, step]);
        });
        setCompletedTask(processed);
      } finally {
        setIsExecuting(false);
      }
    } else {
      setIsExecuting(false);
      onNavigate('tasks');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Create Field Incident Report
        </h1>
        <p className="text-xs text-slate-400">
          Capture observations offline. The on-device agent parses, classifies, and creates civic directives locally.
        </p>
      </div>

      {/* Benchmark Demo Presets */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Quick-Fill Benchmark Scenarios (1-Click Presets)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_DEMOS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    {preset.icon}
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                      {preset.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">~{preset.pop} pop</span>
                </div>
                <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                  {preset.label}
                </h4>
              </div>
              <span className="text-[10px] text-emerald-400 mt-2 font-medium">Use Template →</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Creation Form */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-slate-800/80 space-y-4">
        
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Incident Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Village Primary School Hand Pump Breakdown"
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Description / Field Report Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Field Report Description (Audio transcript or raw field text)
            </label>
            <span className="text-[11px] text-emerald-400 font-mono">Autonomous NLP extraction active</span>
          </div>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the failure, affected population, urgency, and observable symptoms..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
          />
        </div>

        {/* Location & Population */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Location / Landmark
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Near Village Primary School, Sector 2"
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Estimated Affected Population (Families / Persons)
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                value={population}
                onChange={(e) => setPopulation(parseInt(e.target.value, 10) || 0)}
                placeholder="40"
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Zero cloud dependency. Runs 100% offline in browser worker.</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleCreateAndExecute(false)}
              disabled={isExecuting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateAndExecute(true)}
              disabled={isExecuting || !description.trim()}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isExecuting ? 'Processing Locally...' : 'Execute Local Agent'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Trace visualizer */}
      {traceSteps.length > 0 && (
        <AgentExecutionVisualizer
          steps={traceSteps}
          isRunning={isExecuting}
        />
      )}

      {/* Task Detail Modal on Completion */}
      {completedTask && (
        <TaskDetailModal
          task={completedTask}
          onClose={() => {
            setCompletedTask(null);
            onNavigate('tasks');
          }}
        />
      )}

    </div>
  );
};
