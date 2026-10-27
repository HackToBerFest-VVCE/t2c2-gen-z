import React from 'react';
import { 
  Droplet, 
  Sprout, 
  HeartPulse, 
  Building2, 
  GraduationCap, 
  HelpCircle,
  CloudCheck,
  CloudAlert,
  AlertTriangle,
  Clock,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Users,
  MapPin,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { TaskRecord, TaskCategory } from '../types';
import { evaluateTaskPriority } from '../services/priorityAssistant';

interface TaskCardProps {
  task: TaskRecord;
  onClick: () => void;
}

export const getCategoryIcon = (category: TaskCategory) => {
  switch (category) {
    case 'water_supply':
      return <Droplet className="w-4 h-4 text-cyan-400" />;
    case 'agriculture':
      return <Sprout className="w-4 h-4 text-emerald-400" />;
    case 'healthcare':
      return <HeartPulse className="w-4 h-4 text-rose-400" />;
    case 'infrastructure':
      return <Building2 className="w-4 h-4 text-amber-400" />;
    case 'education':
      return <GraduationCap className="w-4 h-4 text-purple-400" />;
    default:
      return <HelpCircle className="w-4 h-4 text-slate-400" />;
  }
};

export const getCategoryBadge = (category: TaskCategory) => {
  const formatName = category.replace('_', ' ');
  return (
    <span className="flex items-center space-x-1 text-xs font-medium px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 capitalize">
      {getCategoryIcon(category)}
      <span>{formatName}</span>
    </span>
  );
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const priorityEval = evaluateTaskPriority(task);
  const isHigh = priorityEval.priority === 'HIGH';
  const isMed = priorityEval.priority === 'MEDIUM';

  return (
    <div 
      onClick={onClick}
      className="glass-panel glass-panel-hover rounded-xl p-4 transition-all duration-200 cursor-pointer border border-slate-800/80 group hover:shadow-xl hover:shadow-emerald-950/20"
      aria-label={`Task: ${task.title}. Priority: ${priorityEval.priority}. Reason: ${priorityEval.reason}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        
        {/* Category & Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {getCategoryBadge(task.category)}

          {/* Smart Priority Assistant Pill */}
          <span 
            className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center ${
              isHigh
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : isMed
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
            title={`Smart Priority: ${priorityEval.priority} (${priorityEval.score}/100) - ${priorityEval.reason}`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
              isHigh ? 'bg-rose-400 animate-ping' : isMed ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            <span>Priority: {priorityEval.priority}</span>
          </span>
        </div>

        {/* Sync / Local Offline Status */}
        <div className="shrink-0">
          {task.status === 'synced' && (
            <span className="flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CloudCheck className="w-3.5 h-3.5" />
              <span>Synced</span>
            </span>
          )}
          {task.status === 'completed_local' && (
            <span className="flex items-center space-x-1 text-[11px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Completed Local</span>
            </span>
          )}
          {task.status === 'conflict' && (
            <span className="flex items-center space-x-1 text-[11px] text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Conflict</span>
            </span>
          )}
          {task.status === 'queued' && (
            <span className="flex items-center space-x-1 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>Queued</span>
            </span>
          )}
        </div>

      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 mb-1">
        {task.title}
      </h4>

      {/* Description Snippet */}
      <p className="text-xs text-slate-300/80 line-clamp-2 mb-2 leading-relaxed">
        {task.agent_output?.summary || task.description}
      </p>

      {/* Smart Priority Assistant Directive Snippet */}
      <div className="mb-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
        <div className="flex items-start space-x-1.5 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="line-clamp-1 text-slate-300">
            <span className="font-semibold text-emerald-300 mr-1">Why {priorityEval.priority}:</span>
            <span className="text-slate-400">{priorityEval.reason}</span>
          </p>
        </div>
        <div className="pl-5 text-[10px] text-slate-400 line-clamp-1">
          <span className="text-slate-400 font-semibold uppercase">Action:</span>{' '}
          <span className="text-slate-300">{priorityEval.suggestedAction}</span>
        </div>
      </div>

      {/* Meta Footer (Location + Population + Actions Count + Verification) */}
      <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 gap-2">
        
        <div className="flex items-center space-x-3">
          {task.location && (
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate max-w-[140px]">{task.location}</span>
            </span>
          )}

          {task.affected_population > 0 && (
            <span className="flex items-center space-x-1 text-slate-300 font-mono">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>~{task.affected_population} pop</span>
            </span>
          )}
        </div>

        {/* Verification Status */}
        <div className="flex items-center space-x-2">
          {task.verified_evidence ? (
            <span className="flex items-center space-x-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Evidence</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-amber-400/90" title="Safety Guardrail: Requires on-site verification before closing repair ticket">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Needs Verification</span>
            </span>
          )}

          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </div>

      </div>

    </div>
  );
};
