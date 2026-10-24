import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  Filter, 
  Plus, 
  CloudUpload, 
  RefreshCw, 
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { db } from '../db';
import { TaskCard } from '../components/TaskCard';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { syncManager } from '../services/syncManager';
import type { TaskRecord, TaskCategory, TaskPriority, TaskStatus } from '../types';

interface TasksPageProps {
  onNavigate: (tab: string) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [activeTask, setActiveTask] = useState<TaskRecord | null>(null);

  const allTasks = useLiveQuery(() => db.tasks.orderBy('created_at').reverse().toArray()) || [];
  const pendingOutboxCount = useLiveQuery(() => db.syncOutbox.where('status').equals('pending').count()) || 0;

  // Filter tasks in memory
  const filteredTasks = allTasks.filter(task => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      const matchLoc = (task.location || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }
    // Category filter
    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
    // Status filter
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;
    // Priority filter
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;

    return true;
  });

  return (
    <div className="space-y-5">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Field Tasks & Incidents
          </h1>
          <p className="text-xs text-slate-400">
            {allTasks.length} total tasks stored in local IndexedDB • Persistent offline cache
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {pendingOutboxCount > 0 && (
            <button
              onClick={() => syncManager.triggerSync()}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
            >
              <CloudUpload className="w-4 h-4" />
              <span>Sync Outbox ({pendingOutboxCount})</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('new')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 space-y-3">
        
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by keywords, location (e.g. 'primary school', 'canal'), or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          
          {/* Category Dropdown */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Domains</option>
              <option value="water_supply">Water Supply</option>
              <option value="agriculture">Agriculture</option>
              <option value="healthcare">Healthcare</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="education">Education</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed_local">Completed Locally</option>
              <option value="synced">Synced with Server</option>
              <option value="queued">Queued</option>
              <option value="conflict">Sync Conflict</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {(search || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedPriority('all');
              }}
              className="text-[11px] text-emerald-400 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}

        </div>

      </div>

      {/* Task Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => setActiveTask(task)}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <ClipboardList className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No matching tasks</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or click create to file a new offline incident report.
          </p>
          <button
            onClick={() => onNavigate('new')}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            Create Task
          </button>
        </div>
      )}

      {/* Task Detail Modal */}
      {activeTask && (
        <TaskDetailModal
          task={activeTask}
          onClose={() => setActiveTask(null)}
          onTaskUpdated={() => {
            db.tasks.get(activeTask.id).then(t => { if (t) setActiveTask(t); });
          }}
        />
      )}

    </div>
  );
};
