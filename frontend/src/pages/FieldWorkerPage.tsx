import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Camera, 
  MapPin, 
  Upload, 
  Save, 
  CloudUpload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  RefreshCw, 
  Image as ImageIcon,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { fieldReportService } from '../services/fieldReportService';
import { aiProviderService } from '../services/aiProviderService';
import { networkSimulator } from '../services/networkSimulator';
import { languageService } from '../services/languageService';
import type { TaskCategory, TaskPriority, FieldReport } from '../types';

interface PhotoAttachmentDraft {
  file: File;
  dataUrl: string;
}

export const FieldWorkerPage: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<string>(languageService.getLanguage());

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('infrastructure');
  const [severity, setSeverity] = useState<TaskPriority>('medium');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [photos, setPhotos] = useState<PhotoAttachmentDraft[]>([]);
  
  // GPS State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState('');
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = languageService.subscribe(lang => setCurrentLang(lang));
    return () => unsub();
  }, []);

  const strings = languageService.getStrings(currentLang);
  const langConfig = languageService.getLanguageConfig(currentLang);

  // Status & AI Analysis State
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiAnalysisFeedback, setAiAnalysisFeedback] = useState<{
    missingInfo: string[];
    supervisorNotes: string;
    provider: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Live queries from IndexedDB
  const localReports = useLiveQuery(
    () => db.reports.orderBy('created_at').reverse().toArray(),
    []
  );

  // Capture GPS Coordinates
  const handleCaptureLocation = () => {
    setIsCapturingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsCapturingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationName(`Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)} (±${Math.round(pos.coords.accuracy)}m)`);
        setIsCapturingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationError(`Location denied: ${err.message}. You can continue without GPS.`);
        setIsCapturingLocation(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Add photos to draft
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach(file => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          alert(`File ${file.name} is not supported. Please select JPEG, PNG, or WebP.`);
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 10MB limit.`);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setPhotos(prev => [...prev, { file, dataUrl: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  // Run AI Report Assistant
  const handleRunAIAssistant = async () => {
    if (!title.trim() && !description.trim()) {
      alert('Please enter a Title and Description before requesting AI analysis.');
      return;
    }

    setIsAnalyzingAI(true);
    setAiAnalysisFeedback(null);

    try {
      const result = await aiProviderService.analyzeReport({
        title,
        description,
        category,
        severity,
        notes
      });

      // Populate AI summary without overwriting original description
      setAiSummary(result.summary);
      if (result.suggestedCategory && !category) {
        setCategory(result.suggestedCategory as TaskCategory);
      }
      if (result.suggestedSeverity && !severity) {
        setSeverity(result.suggestedSeverity as TaskPriority);
      }
      setAiAnalysisFeedback({
        missingInfo: result.missingInfo,
        supervisorNotes: result.supervisorNotes,
        provider: result.providerUsed
      });
    } catch (err: any) {
      console.warn('AI analysis error:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Save Locally (Offline-Safe)
  const handleSaveReport = async (syncNow: boolean = false) => {
    if (!title.trim() || !description.trim()) {
      alert('Please provide a Title and Description for the inspection report.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionSuccess(null);

    try {
      const { report } = await fieldReportService.createReport({
        title,
        description,
        category,
        severity,
        latitude,
        longitude,
        location_name: locationName,
        notes,
        ai_summary: aiSummary,
        original_language: currentLang,
        preferred_language: currentLang,
        photos
      });

      setSubmissionSuccess(`Report "${report.title}" saved durably to local IndexedDB!`);

      // Reset form
      setTitle('');
      setDescription('');
      setNotes('');
      setAiSummary('');
      setPhotos([]);
      setLatitude(null);
      setLongitude(null);
      setLocationName('');
      setAiAnalysisFeedback(null);

      // Trigger sync if requested
      if (syncNow && networkSimulator.isEffectivelyOnline()) {
        await fieldReportService.syncReportToServer(report.id);
      }
    } catch (err: any) {
      alert(`Failed to save report locally: ${err?.message || 'Storage error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /><span>Synced</span></span>;
      case 'syncing':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /><span>Syncing</span></span>;
      case 'sync_failed':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30"><AlertTriangle className="w-3 h-3" /><span>Failed</span></span>;
      default:
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30"><Clock className="w-3 h-3" /><span>Pending Sync</span></span>;
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                <span>Offline Field Worker</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Durable Storage
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Capture inspection reports, photos, and GPS offline. Synchronize when connection returns.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fieldReportService.syncAllPendingReports()}
              disabled={!networkSimulator.isEffectivelyOnline()}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-xs font-medium text-slate-200"
            >
              <CloudUpload className="w-4 h-4 text-emerald-400" />
              <span>Sync Outbox Now</span>
            </button>
          </div>
        </div>

        {submissionSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
            <span>✓ {submissionSuccess}</span>
            <button onClick={() => setSubmissionSuccess(null)} className="text-emerald-400 font-bold ml-2">×</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Report Creation (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Create Inspection Report</span>
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {strings.labelOriginalLanguage}: {langConfig.nativeName} ({langConfig.code})
              </span>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {strings.labelTitle} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Primary School Hand Pump Chain Broken"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Category & Severity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {strings.labelCategory} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="water_supply">{strings.catWater}</option>
                  <option value="agriculture">{strings.catAgriculture}</option>
                  <option value="healthcare">{strings.catHealthcare}</option>
                  <option value="infrastructure">{strings.catInfrastructure}</option>
                  <option value="education">{strings.catEducation}</option>
                  <option value="other">{strings.catOther}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {strings.labelSeverity} *
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as TaskPriority)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="critical">{strings.sevCritical}</option>
                  <option value="high">{strings.sevHigh}</option>
                  <option value="medium">{strings.sevMedium}</option>
                  <option value="low">{strings.sevLow}</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {strings.labelDescription} *
                </label>
                <button
                  type="button"
                  onClick={handleRunAIAssistant}
                  disabled={isAnalyzingAI}
                  className="flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzingAI ? 'Analyzing...' : 'Ask AI Assistant'}</span>
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the physical condition, damage, affected villagers, and immediate observations..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {/* AI Assistant Feedback Banner if available */}
            {aiAnalysisFeedback && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-cyan-300">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AI Field Recommendations ({aiAnalysisFeedback.provider.replace('_', ' ')})</span>
                  </span>
                </div>
                {aiAnalysisFeedback.missingInfo.length > 0 && (
                  <div className="text-amber-300/90">
                    <span className="font-bold">Missing Info: </span>
                    {aiAnalysisFeedback.missingInfo.join(' • ')}
                  </div>
                )}
                <div className="text-slate-300">
                  <span className="font-bold text-slate-400">Supervisor Directive: </span>
                  {aiAnalysisFeedback.supervisorNotes}
                </div>
              </div>
            )}

            {/* Editable AI Summary */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Executive Summary (Editable)
              </label>
              <input
                type="text"
                value={aiSummary}
                onChange={(e) => setAiSummary(e.target.value)}
                placeholder="Concise summary for block officer and supervisor dashboard..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Photo Attachments Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Photographic Evidence ({photos.length} attached)
              </label>

              <div className="flex flex-wrap gap-3 mb-3">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
                    <img src={p.dataUrl} alt={p.file.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-md text-xs transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-slate-300 px-1 py-0.5 truncate text-center">
                      {(p.file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                ))}

                {/* Add Photo Buttons */}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border border-dashed border-slate-700 hover:border-cyan-400/50 bg-slate-900/60 flex flex-col items-center justify-center text-slate-400 hover:text-cyan-300 transition-all text-xs gap-1"
                >
                  <Upload className="w-5 h-5" />
                  <span>Gallery</span>
                </button>

                {/* Camera Capture on Mobile */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border border-dashed border-slate-700 hover:border-emerald-400/50 bg-slate-900/60 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-300 transition-all text-xs gap-1"
                >
                  <Camera className="w-5 h-5" />
                  <span>Camera</span>
                </button>
              </div>
            </div>

            {/* GPS Location Capture */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">GPS Coordinates: </span>
                  {locationName ? locationName : 'None captured (Optional)'}
                </div>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={isCapturingLocation}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200"
                >
                  <MapPin className={`w-3.5 h-3.5 text-cyan-400 ${isCapturingLocation ? 'animate-bounce' : ''}`} />
                  <span>{isCapturingLocation ? 'Acquiring GPS...' : 'Capture Location'}</span>
                </button>
              </div>
              {locationError && (
                <p className="text-[11px] text-amber-400 mt-1">{locationError}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSaveReport(false)}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all shadow-sm"
              >
                <Save className="w-4 h-4 text-slate-400" />
                <span>Save Locally (Offline Safe)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveReport(true)}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-500/20"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Save & Sync Now</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Local Reports Saved on this Device (1 col) */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <span>Local Reports</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-800 text-slate-300">
                  {localReports?.length || 0}
                </span>
              </h3>
            </div>

            {(!localReports || localReports.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No reports saved locally yet. Complete the form to create your first offline report.
              </p>
            ) : (
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {localReports.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs text-white line-clamp-1">{r.title}</div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase ${getSeverityBadge(r.severity)}`}>
                        {r.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2">{r.description}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500">
                      <span>{new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      {getSyncStatusBadge(r.sync_status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
