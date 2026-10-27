import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  CloudUpload, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Server, 
  Database,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { db } from '../db';
import { syncManager, type SyncState } from '../services/syncManager';
import { networkSimulator, type NetworkMode } from '../services/networkSimulator';

interface SmartSyncMonitorProps {
  compact?: boolean;
  onNavigateToSyncHub?: () => void;
}

export const SmartSyncMonitor: React.FC<SmartSyncMonitorProps> = ({ 
  compact = false,
  onNavigateToSyncHub 
}) => {
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    isOnline: true,
    isServerReachable: false,
    serverLatencyMs: null,
    lastSyncTime: null,
    pendingCount: 0,
    syncingCount: 0,
    syncedCount: 0,
    failedCount: 0,
    conflictCount: 0,
    lastError: null,
    isAutoSyncSuspended: false,
    consecutiveFailures: 0
  });

  const [netMode, setNetMode] = useState<NetworkMode>(networkSimulator.getMode());
  const [isPinging, setIsPinging] = useState(false);
  const [showQueueInspector, setShowQueueInspector] = useState(false);

  useEffect(() => {
    const unsubSync = syncManager.subscribe(s => setSyncState(s));
    const unsubNet = networkSimulator.subscribe(m => setNetMode(m));
    return () => {
      unsubSync();
      unsubNet();
    };
  }, []);

  // Reactive IndexedDB queries
  const outboxItems = useLiveQuery(() => db.syncOutbox.toArray()) || [];
  const totalTasks = useLiveQuery(() => db.tasks.count()) || 0;

  const handleManualSync = async () => {
    await syncManager.triggerSync({ isManual: true });
  };

  const handleRetryFailed = async () => {
    await syncManager.retryFailedOperations();
  };

  const handlePingServer = async () => {
    setIsPinging(true);
    try {
      await syncManager.checkServerReachability();
    } finally {
      setIsPinging(false);
    }
  };

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Never in this session';
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 10) return 'Just now';
      if (diffSec < 60) return `${diffSec} seconds ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      return date.toLocaleTimeString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">
      
      {/* Top Bar: Title, Connection Status, Diagnostics & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-md ${
            syncState.isSyncing
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
              : !syncState.isOnline
              ? 'bg-slate-800/80 text-slate-400 border-slate-700'
              : syncState.isServerReachable
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          }`}>
            <Activity className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Smart Offline Sync Monitor
              </h3>
              
              {/* Live Status Pill */}
              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                !syncState.isOnline
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : syncState.isServerReachable
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  !syncState.isOnline ? 'bg-rose-400' : syncState.isServerReachable ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`} />
                <span>
                  {!syncState.isOnline
                    ? 'Offline'
                    : syncState.isServerReachable
                    ? `Connected (${syncState.serverLatencyMs ?? 0}ms)`
                    : 'Server Unreachable'}
                </span>
              </span>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
              <span>Last confirmed sync:</span>
              <span className="text-slate-300 font-semibold">{formatLastSync(syncState.lastSyncTime)}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {/* Probe Server Health */}
          <button
            onClick={handlePingServer}
            disabled={isPinging || !syncState.isOnline}
            title="Probe backend health and measure roundtrip latency"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/80 transition-colors disabled:opacity-50"
          >
            <Server className={`w-3.5 h-3.5 ${isPinging ? 'animate-pulse text-cyan-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Probe API</span>
          </button>

          {/* Retry Failed (if any failed operations) */}
          {syncState.failedCount > 0 && (
            <button
              onClick={handleRetryFailed}
              disabled={syncState.isSyncing || !syncState.isOnline}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Failed ({syncState.failedCount})</span>
            </button>
          )}

          {/* Sync Now Button */}
          <button
            onClick={handleManualSync}
            disabled={syncState.isSyncing || !syncState.isOnline}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              syncState.isSyncing
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                : !syncState.isOnline
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            <span>{syncState.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

      </div>

      {/* Sync Failure or Warning Notice */}
      {syncState.lastError && (
        <div className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
          syncState.isAutoSyncSuspended
            ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
        }`}>
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] block">
                {syncState.isAutoSyncSuspended ? 'Sync Retry Limit Reached' : 'Synchronization Notice'}
              </span>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                {syncState.lastError}
              </p>
            </div>
          </div>
          {syncState.isAutoSyncSuspended && (
            <button
              onClick={handleRetryFailed}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold shrink-0"
            >
              Recover
            </button>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        
        {/* Pending Queue */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center justify-center space-x-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pending</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">
            {syncState.pendingCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">In offline outbox</p>
        </div>

        {/* Syncing Active */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center justify-center space-x-1">
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
            <span>Syncing</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono">
            {syncState.syncingCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Active payloads</p>
        </div>

        {/* Synced Confirmation */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center justify-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Synced</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
            {syncState.syncedCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Verified on server</p>
        </div>

        {/* Failed Operations */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center justify-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Failed</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono">
            {syncState.failedCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Eligible for retry</p>
        </div>

        {/* Revision Conflicts */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center justify-center space-x-1">
            <Zap className="w-3 h-3 text-purple-400" />
            <span>Conflicts</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-400 font-mono">
            {syncState.conflictCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">3-way resolution</p>
        </div>

      </div>

      {/* Outbox Queue Toggle & Inspector */}
      {!compact && outboxItems.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowQueueInspector(prev => !prev)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-xs text-slate-300 font-medium transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect Persistent Outbox Queue ({outboxItems.length} items)</span>
            </div>
            {showQueueInspector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showQueueInspector && (
            <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {outboxItems.map(item => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="text-cyan-400 font-bold uppercase text-[10px]">
                        {item.action}
                      </span>
                      <span className="text-white font-sans truncate text-xs">
                        {item.payload.title || item.task_id}
                      </span>
                    </div>
                    {item.last_error && (
                      <p className="text-[10px] text-rose-400 truncate mt-0.5">
                        Error: {item.last_error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] text-slate-400">
                      Retries: {item.retry_count}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      item.status === 'failed'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation link to full Sync Hub if on Dashboard */}
      {onNavigateToSyncHub && (
        <div className="pt-1 flex justify-end">
          <button
            onClick={onNavigateToSyncHub}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Open Full Sync Hub & Audit Log Stream →
          </button>
        </div>
      )}

    </div>
  );
};
