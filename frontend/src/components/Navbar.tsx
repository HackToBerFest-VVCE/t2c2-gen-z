import React, { useEffect, useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryCharging, 
  BatteryWarning, 
  CloudUpload, 
  Cpu, 
  LayoutDashboard, 
  ClipboardList, 
  RefreshCw, 
  Sliders, 
  Mic, 
  FileText, 
  Server, 
  Sparkles 
} from 'lucide-react';
import { networkSimulator, type NetworkMode } from '../services/networkSimulator';
import { resourceManager, type ResourceStatus } from '../services/resourceManager';
import { syncManager, type SyncState } from '../services/syncManager';
import { aiProviderService } from '../services/aiProviderService';
import type { OperatingMode } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const [netMode, setNetMode] = useState<NetworkMode>(networkSimulator.getMode());
  const [aiMode, setAiMode] = useState<OperatingMode>(aiProviderService.getMode());
  const [isOnline, setIsOnline] = useState<boolean>(networkSimulator.isEffectivelyOnline());
  const [resources, setResources] = useState<ResourceStatus>(resourceManager.getStatus());
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    isOnline: true,
    isServerReachable: false,
    serverLatencyMs: null,
    lastSyncTime: null,
    pendingCount: 0,
    syncingCount: 0,
    lastError: null,
    syncedCount: 0,
    failedCount: 0,
    conflictCount: 0,
    isAutoSyncSuspended: false,
    consecutiveFailures: 0
  });

  useEffect(() => {
    const unsubNet = networkSimulator.subscribe((mode, online) => {
      setNetMode(mode);
      setIsOnline(online);
    });
    const unsubRes = resourceManager.subscribe(s => setResources(s));
    const unsubSync = syncManager.subscribe(s => setSyncState(s));
    const unsubAi = aiProviderService.subscribe(s => setAiMode(s.mode));

    return () => {
      unsubNet();
      unsubRes();
      unsubSync();
      unsubAi();
    };
  }, []);

  const batteryPercent = Math.round(resources.batteryLevel * 100);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-[#0b111e]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">FieldPilot</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Offline-First AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Autonomous Rural Agent Runtime</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onSelectTab('voice')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'voice'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Copilot</span>
            </button>

            <button
              onClick={() => onSelectTab('field')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'field'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Field Worker</span>
            </button>

            <button
              onClick={() => onSelectTab('supervisor')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'supervisor'
                  ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Supervisor</span>
            </button>

            <button
              onClick={() => onSelectTab('tasks')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'tasks'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Tasks</span>
            </button>

            <button
              onClick={() => onSelectTab('sync')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                currentTab === 'sync'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CloudUpload className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-bounce text-emerald-400' : ''}`} />
              <span>Sync Hub</span>
              {syncState.pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {syncState.pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('agent')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'agent'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Runtime</span>
            </button>
          </nav>

          {/* Right Status Badges */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Sync Status Button */}
            <button
              onClick={() => syncManager.triggerSync({ isManual: true })}
              disabled={syncState.isSyncing || !isOnline}
              title={isOnline ? 'Click to trigger server synchronization' : 'Offline - Outbox queued'}
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                syncState.isSyncing
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                  : syncState.pendingCount > 0
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${syncState.isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">
                {syncState.isSyncing ? 'Syncing...' : syncState.pendingCount > 0 ? `${syncState.pendingCount} Outbox` : 'Synced'}
              </span>
            </button>

            {/* Operating Mode Selector */}
            <div className="relative group">
              <button
                className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  aiMode === 'strict_offline'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    : aiMode === 'hybrid'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span className="capitalize font-mono text-[11px] hidden sm:inline">
                  {aiMode.replace('_', ' ')}
                </span>
              </button>
            </div>

            {/* Network Simulator */}
            <div className="relative group">
              <button
                className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  !isOnline
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse'
                    : netMode === '2g_flaky'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {!isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                <span className="uppercase font-mono text-[11px] hidden sm:inline">{netMode === '2g_flaky' ? '2G' : netMode}</span>
              </button>
            </div>

            {/* Battery Indicator */}
            <div
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium border ${
                resources.lowPowerMode
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {resources.isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              ) : resources.lowPowerMode ? (
                <BatteryWarning className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Battery className="w-3.5 h-3.5" />
              )}
              <span className="font-mono text-[11px]">{batteryPercent}%</span>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/90 py-1.5 text-xs">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 shrink-0 ${currentTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Dash</span>
        </button>
        <button
          onClick={() => onSelectTab('voice')}
          className={`flex flex-col items-center py-1 px-2 shrink-0 ${currentTab === 'voice' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <Mic className="w-4 h-4 mb-0.5" />
          <span>Voice</span>
        </button>
        <button
          onClick={() => onSelectTab('field')}
          className={`flex flex-col items-center py-1 px-2 shrink-0 ${currentTab === 'field' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span>Field</span>
        </button>
        <button
          onClick={() => onSelectTab('supervisor')}
          className={`flex flex-col items-center py-1 px-2 shrink-0 ${currentTab === 'supervisor' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <Server className="w-4 h-4 mb-0.5" />
          <span>Superv</span>
        </button>
        <button
          onClick={() => onSelectTab('tasks')}
          className={`flex flex-col items-center py-1 px-2 shrink-0 ${currentTab === 'tasks' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <ClipboardList className="w-4 h-4 mb-0.5" />
          <span>Tasks</span>
        </button>
        <button
          onClick={() => onSelectTab('sync')}
          className={`flex flex-col items-center py-1 px-2 shrink-0 ${currentTab === 'sync' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <CloudUpload className="w-4 h-4 mb-0.5" />
          <span>Sync ({syncState.pendingCount})</span>
        </button>
      </div>
    </header>
  );
};
