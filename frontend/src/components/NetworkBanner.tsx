import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Radio, Info, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { networkSimulator, type NetworkMode } from '../services/networkSimulator';

export const NetworkBanner: React.FC = () => {
  const [mode, setMode] = useState<NetworkMode>(networkSimulator.getMode());

  useEffect(() => {
    return networkSimulator.subscribe((newMode) => {
      setMode(newMode);
    });
  }, []);

  return (
    <div className={`border-b transition-colors duration-300 ${
      mode === 'offline'
        ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/70 border-rose-900/50 text-rose-200'
        : mode === '2g_flaky'
        ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-amber-900/50 text-amber-200'
        : 'bg-gradient-to-r from-emerald-950/50 via-slate-900 to-emerald-950/50 border-emerald-900/40 text-emerald-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          
          <div className="flex items-center space-x-2">
            {mode === 'offline' && <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />}
            {mode === '2g_flaky' && <Radio className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />}
            {mode === 'online' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            
            <span>
              <strong className="font-semibold uppercase tracking-wider mr-1">
                {mode === 'offline' ? 'Offline Mode Active:' : mode === '2g_flaky' ? 'Flaky 2G Mode:' : 'Online Connected:'}
              </strong>
              {mode === 'offline'
                ? 'Tasks run 100% on local device AI runtime. Changes are saved to IndexedDB outbox.'
                : mode === '2g_flaky'
                ? 'Simulating packet drops and high latency. Outbox will automatically retry.'
                : 'Server sync active. Tasks synchronize with verified acknowledgement protocol.'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-[11px] text-slate-400 mr-1 hidden md:inline">Test Connectivity:</span>
            
            <button
              onClick={() => networkSimulator.setMode('online')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                mode === 'online'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Online
            </button>

            <button
              onClick={() => networkSimulator.setMode('2g_flaky')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                mode === '2g_flaky'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Flaky 2G
            </button>

            <button
              onClick={() => networkSimulator.setMode('offline')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                mode === 'offline'
                  ? 'bg-rose-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Simulate Offline
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
