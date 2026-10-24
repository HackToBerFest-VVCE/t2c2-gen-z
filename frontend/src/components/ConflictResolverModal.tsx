import React from 'react';
import { AlertTriangle, Check, ArrowRight, ShieldAlert, GitMerge, X } from 'lucide-react';
import type { TaskRecord } from '../types';
import { syncManager } from '../services/syncManager';

interface ConflictResolverModalProps {
  localTask: TaskRecord;
  serverTask?: Partial<TaskRecord> | null;
  onClose: () => void;
  onResolved: () => void;
}

export const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({
  localTask,
  serverTask,
  onClose,
  onResolved
}) => {
  const handleResolve = async (choice: 'keep_local' | 'keep_server' | 'merge') => {
    await syncManager.resolveConflict(localTask.id, choice);
    onResolved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-4xl rounded-2xl border border-rose-500/40 bg-slate-900/95 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-rose-950/20 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Concurrent Edit Conflict Detected</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Revision Collision
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                This task was modified on the central server while this device was operating offline.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Local Version */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/40 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Your Local Offline Version</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Rev {localTask.revision} (Offline)
              </span>
            </div>

            <div className="space-y-2.5 text-xs flex-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Title:</span>
                <span className="font-semibold text-white">{localTask.title}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Priority:</span>
                <span className="font-semibold text-amber-300 uppercase">{localTask.priority}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Description:</span>
                <p className="text-slate-300">{localTask.description}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location:</span>
                <span className="text-slate-200">{localTask.location || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Evidence Verified:</span>
                <span className={localTask.verified_evidence ? 'text-emerald-400' : 'text-amber-400'}>
                  {localTask.verified_evidence ? 'Verified ✓' : 'Unverified'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleResolve('keep_local')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Keep Local Offline Version</span>
            </button>
          </div>

          {/* Server Version */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/40 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Central Server Version</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Rev {serverTask?.revision || (localTask.revision + 1)} (Server)
              </span>
            </div>

            <div className="space-y-2.5 text-xs flex-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Title:</span>
                <span className="font-semibold text-white">{serverTask?.title || localTask.title}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Priority:</span>
                <span className="font-semibold text-amber-300 uppercase">{serverTask?.priority || 'high'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Description:</span>
                <p className="text-slate-300">{serverTask?.description || localTask.description}</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location:</span>
                <span className="text-slate-200">{serverTask?.location || localTask.location || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Evidence Verified:</span>
                <span className={serverTask?.verified_evidence ? 'text-emerald-400' : 'text-amber-400'}>
                  {serverTask?.verified_evidence ? 'Verified ✓' : 'Unverified'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleResolve('keep_server')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Accept Remote Server Version</span>
            </button>
          </div>

        </div>

        {/* Footer with Merge option */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Select one of the actions above or choose auto-merge to preserve both records.
          </p>
          <button
            onClick={() => handleResolve('merge')}
            className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <GitMerge className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto-Merge Revisions</span>
          </button>
        </div>

      </div>
    </div>
  );
};
