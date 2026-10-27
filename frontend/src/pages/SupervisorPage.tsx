import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Calendar, 
  User, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Filter, 
  Image as ImageIcon,
  Sparkles,
  Server,
  AlertCircle
} from 'lucide-react';
import { networkSimulator } from '../services/networkSimulator';

interface ServerReport {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string;
  worker_id: string;
  notes?: string;
  ai_summary?: string;
  ai_status: string;
  sync_status: string;
  original_language?: string;
  revision: number;
  created_at: string;
  updated_at: string;
  attachments: Array<{
    id: string;
    report_id: string;
    filename: string;
    mime_type: string;
    size_bytes: number;
    url: string;
  }>;
}

export const SupervisorPage: React.FC = () => {
  const [reports, setReports] = useState<ServerReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  const isOnline = networkSimulator.isEffectivelyOnline();

  const fetchServerReports = async () => {
    setIsLoading(true);
    setError(null);

    if (!networkSimulator.isEffectivelyOnline()) {
      setIsLoading(false);
      setError('Cannot load Supervisor records while offline. Connect to network to view server-acknowledged reports.');
      return;
    }

    try {
      let url = '/api/reports?limit=100';
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }
      if (selectedSeverity !== 'all') {
        url += `&severity=${selectedSeverity}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server returned status HTTP ${res.status}`);
      }

      const data = await res.json();
      setReports(data);
    } catch (err: any) {
      console.warn('Supervisor fetch error:', err);
      setError(`Failed to retrieve reports from server: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServerReports();
  }, [selectedCategory, selectedSeverity]);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'medium':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                <span>Supervisor Dashboard</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  Server Persisted
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Verified inspection records and photographic evidence synchronized to central server database.
              </p>
            </div>
          </div>

          <button
            onClick={fetchServerReports}
            disabled={isLoading || !isOnline}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-xs font-semibold text-white transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Server Records</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="water_supply">Water Supply</option>
            <option value="agriculture">Agriculture</option>
            <option value="healthcare">Healthcare</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <span className="text-xs text-slate-500 ml-auto font-mono">
            {reports.length} Synchronized Records
          </span>
        </div>
      </div>

      {/* Offline Notice or Error */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-slate-500 glass-panel rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Querying central SQLite database...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500 glass-panel rounded-2xl border border-slate-800">
          No synchronized reports match the selected filters. Submit a report from Field Worker mode and click "Sync Now".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((r) => (
            <div
              key={r.id}
              className="glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-white line-clamp-1">{r.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase shrink-0 ${getSeverityBadge(r.severity)}`}>
                    {r.severity}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] mb-2">
                  <span className="text-indigo-400 font-mono capitalize">
                    {r.category.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-3">
                  {r.description}
                </p>

                {/* AI Summary Brief */}
                {r.ai_summary && (
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1 mb-3">
                    <div className="flex items-center justify-between font-semibold text-indigo-300">
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Executive Brief:</span>
                      </span>
                    </div>
                    <p className="text-slate-400 leading-normal">{r.ai_summary}</p>
                  </div>
                )}

                {/* Photographs attached */}
                {r.attachments && r.attachments.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <div className="text-[10px] font-semibold text-slate-400 flex items-center space-x-1">
                      <ImageIcon className="w-3 h-3 text-indigo-400" />
                      <span>Evidence Photographs ({r.attachments.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.attachments.map((att) => (
                        <button
                          key={att.id}
                          onClick={() => setActivePhotoModal(att.url)}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-400 transition-colors group"
                        >
                          <img
                            src={att.url}
                            alt={att.filename}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              // Fallback placeholder if image load fails
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* GPS Location details */}
                {(r.latitude && r.longitude) ? (
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{r.location_name || `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`}</span>
                  </div>
                ) : null}
              </div>

              {/* Card Footer: Worker & Timestamp */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{r.worker_id}</span>
                </span>
                <span>{new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Attachment Photo */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative max-w-2xl w-full p-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white font-bold hover:bg-slate-700 flex items-center justify-center border border-slate-600 shadow-lg"
            >
              ×
            </button>
            <img src={activePhotoModal} alt="Full inspection evidence" className="w-full h-auto rounded-xl max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

    </div>
  );
};
