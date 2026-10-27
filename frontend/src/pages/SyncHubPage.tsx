import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Database
} from 'lucide-react';
import { db } from '../db';
import { syncManager } from '../services/syncManager';
import { ConflictResolverModal } from '../components/ConflictResolverModal';
import { SmartSyncMonitor } from '../components/SmartSyncMonitor';
import type { TaskRecord } from '../types';

export const SyncHubPage: React.FC = () => {
  const [conflictTask, setConflictTask] = useState<TaskRecord | null>(null);
  const [conflictServerTask, setConflictServerTask] = useState<Partial<TaskRecord> | null>(null);

  const outboxItems = useLiveQuery(() => db.syncOutbox.toArray()) || [];
  const auditLogs = useLiveQuery(() => db.auditLogs.orderBy('timestamp').reverse().limit(30).toArray()) || [];
  const conflictingTasks = useLiveQuery(() => db.tasks.where('status').equals('conflict').toArray()) || [];

  const handleOpenConflict = async (task: TaskRecord) => {
    const outboxItem = await db.syncOutbox.where('task_id').equals(task.id).first();
    setConflictTask(task);
    setConflictServerTask(outboxItem?.server_task || null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Sync Hub & Outbox Queue
          </h1>
          <p className="text-xs text-slate-400">
            Offline-first transactional replication with server revision checks & conflict handling
          </p>
        </div>

      </div>

      {/* Smart Offline Sync Monitor */}
      <SmartSyncMonitor />

      {/* Conflicts section if any */}
      {conflictingTasks.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-rose-500/40 bg-rose-950/20 space-y-3">
          <div className="flex items-center space-x-2 text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <h3 className="text-sm font-bold">Unresolved Concurrent Edit Conflicts ({conflictingTasks.length})</h3>
          </div>
          <p className="text-xs text-slate-300">
            These tasks were edited concurrently on both this offline device and the remote central server.
          </p>

          <div className="space-y-2">
            {conflictingTasks.map(t => (
              <div key={t.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">{t.title}</span>
                  <span className="text-slate-400 ml-2 font-mono">(Local Rev {t.revision})</span>
                </div>
                <button
                  onClick={() => handleOpenConflict(t)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold transition-colors"
                >
                  Resolve Conflict →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outbox Items List */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Local Outbox Transmissions ({outboxItems.length})</span>
        </h3>

        {outboxItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Outbox ID</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Task Details</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Retries</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {outboxItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.id.slice(0, 16)}...</td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-cyan-400">{item.action}</td>
                    <td className="py-2.5 px-3 text-white font-sans text-xs">
                      {item.payload.title || item.task_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        item.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : item.status === 'conflict'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{item.retry_count}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(item.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center italic">
            Outbox is clear. All local tasks are fully synchronized with the server.
          </p>
        )}
      </div>

      {/* Audit Log Stream */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Cryptographic Audit & Sync Event Stream</span>
        </h3>

        <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs">
          {auditLogs.map(log => (
            <div key={log.id} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2 mb-0.5">
                  <span className="text-emerald-400 font-bold uppercase text-[10px]">{log.action}</span>
                  <span className="text-slate-500 text-[10px]">Actor: {log.actor}</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Modal */}
      {conflictTask && (
        <ConflictResolverModal
          localTask={conflictTask}
          serverTask={conflictServerTask}
          onClose={() => setConflictTask(null)}
          onResolved={() => {
            setConflictTask(null);
            syncManager.triggerSync();
          }}
        />
      )}

    </div>
  );
};
