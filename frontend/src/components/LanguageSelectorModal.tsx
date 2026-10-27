import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Check, 
  Globe, 
  Sparkles, 
  Mic, 
  Volume2, 
  HardDrive, 
  AlertCircle, 
  Clock, 
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { 
  languageService, 
  LANGUAGE_REGISTRY 
} from '../services/languageService';
import type { LanguageCapability } from '../types';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage?: (langCode: string) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLanguage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState<'All' | 'Indian' | 'International'>('All');
  const [selectedCode, setSelectedCode] = useState<string>(languageService.getLanguage());
  const [recentList, setRecentList] = useState<LanguageCapability[]>(languageService.getRecentLanguages());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCode(languageService.getLanguage());
      setRecentList(languageService.getRecentLanguages());
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const filteredLanguages = useMemo(() => {
    return languageService.searchLanguages(searchQuery, familyFilter);
  }, [searchQuery, familyFilter]);

  if (!isOpen) return null;

  const handleSelect = async (code: string) => {
    setSelectedCode(code);
    await languageService.setLanguage(code);
    if (onSelectLanguage) {
      onSelectLanguage(code);
    }
    setRecentList(languageService.getRecentLanguages());
    onClose();
  };

  const currentConfig = languageService.getLanguageConfig(selectedCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-3xl bg-[#0d1527] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Select Language & Dialect</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {LANGUAGE_REGISTRY.length} Languages
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Current: <span className="text-emerald-300 font-semibold">{currentConfig.name} ({currentConfig.nativeName})</span> • Updates UI, Voice Copilot & Reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/30 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language, native script, or region (e.g., Kannada, ಕನ್ನಡ, हिन्दी, Español)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/70 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5">
              {(['All', 'Indian', 'International'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFamilyFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    familyFilter === tab
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {tab === 'All' ? 'All Languages' : tab === 'Indian' ? 'Indian Languages' : 'International'}
                </button>
              ))}
            </div>

            {/* RTL / Unicode Notice */}
            <div className="text-[11px] text-slate-500 hidden sm:flex items-center space-x-1">
              <span>Supports Unicode native scripts & RTL (Arabic/Urdu)</span>
            </div>
          </div>
        </div>

        {/* Recently Used Languages Row */}
        {recentList.length > 0 && !searchQuery && (
          <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/50 flex items-center space-x-2 overflow-x-auto text-xs">
            <div className="flex items-center text-slate-400 text-[11px] font-medium shrink-0 space-x-1 mr-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Recent:</span>
            </div>
            {recentList.map(rec => (
              <button
                key={`recent-${rec.code}`}
                onClick={() => handleSelect(rec.code)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all shrink-0 ${
                  selectedCode === rec.code
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <span className="font-semibold">{rec.nativeName}</span>
                <span className="text-[10px] opacity-75">({rec.name})</span>
                {selectedCode === rec.code && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            ))}
          </div>
        )}

        {/* Languages Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 divide-y divide-slate-800/40 space-y-2">
          {filteredLanguages.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Globe className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-sm">No languages found matching "{searchQuery}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by English name, script, or country.</p>
            </div>
          ) : (
            filteredLanguages.map(item => {
              const isSelected = selectedCode === item.code;
              const hasVoice = languageService.hasLocalVoice(item.code);

              return (
                <div
                  key={item.code}
                  onClick={() => handleSelect(item.code)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/5'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2.5 flex-wrap">
                      <span className="text-base font-bold text-white tracking-wide">
                        {item.nativeName}
                      </span>
                      <span className="text-xs font-medium text-slate-300">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                        {item.code}
                      </span>
                      {item.direction === 'rtl' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                          RTL
                        </span>
                      )}
                      {item.region && (
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          • {item.region}
                        </span>
                      )}
                    </div>

                    {/* Capability Tags */}
                    <div className="flex items-center space-x-2 mt-2 flex-wrap gap-y-1 text-[11px]">
                      {item.textGenOnline && (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Gemini AI</span>
                        </span>
                      )}
                      {item.textGenOffline && (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>Offline Rules</span>
                        </span>
                      )}
                      {item.sttOnline ? (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          <Mic className="w-2.5 h-2.5" />
                          <span>Speech-to-Text</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          <span>Text Input Only</span>
                        </span>
                      )}
                      {hasVoice ? (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <Volume2 className="w-2.5 h-2.5" />
                          <span>Installed Voice</span>
                        </span>
                      ) : item.ttsOnline ? (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
                          <Volume2 className="w-2.5 h-2.5" />
                          <span>Browser TTS</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Sample Query */}
                    <p className="text-xs text-slate-400 mt-1.5 italic truncate">
                      "{item.sampleQuery}"
                    </p>
                  </div>

                  {/* Selection Button / Indicator */}
                  <div className="shrink-0 pl-2">
                    {isSelected ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-emerald-500 group-hover:text-emerald-400 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Real-time voice synthesis and offline speech recognition depend on your device's installed voice engines.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
