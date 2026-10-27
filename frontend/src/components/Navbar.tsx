import React, { useEffect, useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Radio, 
  Battery, 
  BatteryCharging, 
  BatteryWarning, 
  Cloud, 
  CloudUpload, 
  Cpu, 
  LayoutDashboard, 
  ClipboardList, 
  PlusCircle, 
  RefreshCw, 
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Mic,
  FileText,
  Server,
  Sparkles,
  Globe
} from 'lucide-react';
import { networkSimulator, type NetworkMode } from '../services/networkSimulator';
import { resourceManager, type ResourceStatus } from '../services/resourceManager';
import { syncManager, type SyncState } from '../services/syncManager';
import { aiProviderService } from '../services/aiProviderService';
import { languageService } from '../services/languageService';
import { LanguageSelectorModal } from './LanguageSelectorModal';
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
  const [currentLang, setCurrentLang] = useState<string>(languageService.getLanguage());
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);
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
    const unsubLang = languageService.subscribe(lang => setCurrentLang(lang));

    return () => {
      unsubNet();
      unsubRes();
      unsubSync();
      unsubAi();
      unsubLang();
    };
  }, []);

  const langConfig = languageService.getLanguageConfig(currentLang);
  const strings = languageService.getStrings(currentLang);
  const batteryPercent = Math.round(resources.batteryLevel * 100);

  return (
    <>
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
              <span>{strings.navDashboard}</span>
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
              <span>{strings.navVoice}</span>
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
              <span>{strings.navField}</span>
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
              <span>{strings.navSupervisor}</span>
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
              <span>{strings.navTasks}</span>
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
              <span>{strings.navSync}</span>
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
              <span>{strings.navRuntime}</span>
            </button>
          </nav>

          {/* Right Status Badges */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Global Language Selector Trigger Button */}
            <button
              onClick={() => setIsLangModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-emerald-500/50 transition-all shadow-sm group"
              title="Change Language (ಅಡಿಕೆ / हिन्दी / English / etc.)"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform duration-300" />
              <span className="font-bold text-white tracking-wide">{langConfig.nativeName}</span>
              <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">({langConfig.code})</span>
            </button>

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

            {/* Operating Mode Selector Dropdown */}
            <div className="relative group">
              <button
                className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  aiMode === 'strict_offline'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    : aiMode === 'hybrid'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                }`}
                title="AI Operating Mode (Online / Hybrid / Strict Offline)"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="hidden md:inline font-mono uppercase text-[10px]">
                  {aiMode === 'strict_offline' ? 'Strict Offline' : aiMode === 'hybrid' ? 'Hybrid AI' : 'Online AI'}
                </span>
              </button>

              <div className="absolute right-0 mt-1 w-52 py-2 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  AI Operating Mode
                </div>
                <button
                  onClick={() => aiProviderService.setMode('online')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 flex items-center justify-between"
                >
                  <span>Online (Gemini Cloud)</span>
                  {aiMode === 'online' && <span className="text-emerald-400 font-bold">✓</span>}
                </button>
                <button
                  onClick={() => aiProviderService.setMode('hybrid')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center justify-between"
                >
                  <span>Hybrid (Local First + Cloud)</span>
                  {aiMode === 'hybrid' && <span className="text-cyan-400 font-bold">✓</span>}
                </button>
                <button
                  onClick={() => aiProviderService.setMode('strict_offline')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-rose-500/20 hover:text-rose-300 flex items-center justify-between"
                >
                  <span>Strict Offline (Zero Cloud)</span>
                  {aiMode === 'strict_offline' && <span className="text-rose-400 font-bold">✓</span>}
                </button>
              </div>
            </div>

            {/* Battery Indicator Badge */}
            <div 
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-mono font-medium border ${
                resources.lowPowerMode
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse-subtle'
                  : batteryPercent <= 20
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800/60 text-emerald-400 border-slate-700/50'
              }`}
              title={`Battery: ${batteryPercent}% ${resources.isCharging ? '(Charging)' : ''} | Low Power Mode: ${resources.lowPowerMode ? 'ON' : 'OFF'}`}
            >
              {resources.isCharging ? (
                <BatteryCharging className="w-3 h-3 text-emerald-400" />
              ) : batteryPercent <= 20 ? (
                <BatteryWarning className="w-3 h-3 text-rose-400" />
              ) : (
                <Battery className="w-3 h-3 text-emerald-400" />
              )}
              <span>{batteryPercent}%</span>
            </div>

            {/* Network Mode Simulator Pill */}
            <div className="relative group">
              <button
                className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  netMode === 'online'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : netMode === '2g_flaky'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                }`}
              >
                {netMode === 'online' && <Wifi className="w-3 h-3 text-emerald-400" />}
                {netMode === '2g_flaky' && <Radio className="w-3 h-3 text-amber-400 animate-pulse" />}
                {netMode === 'offline' && <WifiOff className="w-3 h-3 text-rose-400" />}
                <span className="font-semibold capitalize text-[11px]">{netMode.replace('_', ' ')}</span>
              </button>

              <div className="absolute right-0 mt-1 w-48 py-2 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Simulate Field Network
                </div>
                <button
                  onClick={() => networkSimulator.setMode('online')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 flex items-center space-x-2"
                >
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Online (Connected)</span>
                </button>
                <button
                  onClick={() => networkSimulator.setMode('2g_flaky')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 flex items-center space-x-2"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Flaky 2G (Intermittent)</span>
                </button>
                <button
                  onClick={() => networkSimulator.setMode('offline')}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-rose-500/20 hover:text-rose-300 flex items-center space-x-2"
                >
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Deep Offline (No Internet)</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex lg:hidden border-t border-slate-800 bg-[#0b111e]/95 px-2 py-1 justify-around text-xs overflow-x-auto">
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
        <button
          onClick={() => setIsLangModalOpen(true)}
          className="flex flex-col items-center py-1 px-2 shrink-0 text-slate-300 hover:text-emerald-400"
          title="Change Language"
        >
          <Globe className="w-4 h-4 mb-0.5 text-emerald-400" />
          <span className="font-semibold text-[10px]">{langConfig.nativeName}</span>
        </button>
      </div>
      </header>

      {/* Searchable Language Selector Modal */}
      <LanguageSelectorModal 
        isOpen={isLangModalOpen} 
        onClose={() => setIsLangModalOpen(false)} 
      />
    </>
  );
};
