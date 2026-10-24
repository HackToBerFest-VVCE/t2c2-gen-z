import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { NetworkBanner } from './components/NetworkBanner';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { NewTaskPage } from './pages/NewTaskPage';
import { SyncHubPage } from './pages/SyncHubPage';
import { AgentStudioPage } from './pages/AgentStudioPage';
import { initializeDatabase } from './db';
import { agentRunner } from './agent/runner';
import { syncManager } from './services/syncManager';
import { networkSimulator } from './services/networkSimulator';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Sync tab with URL hash if present
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (['dashboard', 'tasks', 'new', 'sync', 'agent'].includes(hash)) {
        setCurrentTab(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    window.location.hash = `#/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Startup lifecycle
  useEffect(() => {
    const startApp = async () => {
      // 1. Initialize IndexedDB & Seed initial benchmark demo if empty
      await initializeDatabase();
      
      // 2. Resume any eligible queued jobs on application startup
      await agentRunner.processQueuedTasks();

      // 3. Initial sync if online
      if (networkSimulator.isEffectivelyOnline()) {
        await syncManager.triggerSync();
      }
    };

    startApp().catch(err => {
      console.error('FieldPilot startup initialization error:', err);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* Network Simulator Banner */}
      <NetworkBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && <DashboardPage onNavigate={handleSelectTab} />}
        {currentTab === 'tasks' && <TasksPage onNavigate={handleSelectTab} />}
        {currentTab === 'new' && <NewTaskPage onNavigate={handleSelectTab} />}
        {currentTab === 'sync' && <SyncHubPage />}
        {currentTab === 'agent' && <AgentStudioPage />}
      </main>

      {/* Modern Field Footer */}
      <footer className="glass-panel border-t border-slate-800/80 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">FieldPilot</span>
            <span>•</span>
            <span>Offline-First Autonomous Agent System</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">v1.0.0 Verified Prototype</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>PWA Enabled</span>
            <span>•</span>
            <span>IndexedDB Persistence</span>
            <span>•</span>
            <span>Zero Cloud Mandatory</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
