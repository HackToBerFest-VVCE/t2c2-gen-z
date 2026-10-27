import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  X, 
  Check, 
  Sparkles, 
  Mic, 
  Volume2, 
  ShieldCheck, 
  Clock, 
  Info,
  Layers
} from 'lucide-react';
import { 
  languageService, 
  LANGUAGE_REGISTRY 
} from '../services/languageService';
import type { LanguageCapability } from '../types';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage?: (code: string) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLanguage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<'All' | 'Indian' | 'International'>('All');
  const [activeCode, setActiveCode] = useState<string>(languageService.getLanguage());
  const [recentLanguages, setRecentLanguages] = useState<LanguageCapability[]>([]);

  useEffect(() => {
    if (isOpen) {
      setActiveCode(languageService.getLanguage());
      setRecentLanguages(languageService.getRecentLanguages());
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = languageService.subscribe((lang) => {
      setActiveCode(lang);
      setRecentLanguages(languageService.getRecentLanguages());
    });
    return () => unsub();
  }, []);

  // Filter languages based on search query and family tab
  const filteredLanguages = useMemo(() => {
    return languageService.searchLanguages(searchQuery, selectedFamily);
  }, [searchQuery, selectedFamily]);

  if (!isOpen) return null;

  const handleChoose = async (lang: LanguageCapability) => {
    await languageService.setLanguage(lang.code);
    setActiveCode(lang.code);
    if (onSelectLanguage) {
      onSelectLanguage(lang.code);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Select Language</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/30">
                  {LANGUAGE_REGISTRY.length} Languages
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose your preferred voice & application language
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Family Tabs */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by English name, native script (ಕನ್ನಡ, हिन्दी, বাংলা), or code..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-2 text-xs">
            {(['All', 'Indian', 'International'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFamily(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedFamily === tab
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab === 'All' ? 'All Languages' : tab === 'Indian' ? 'Indian Languages (ಭಾರತೀಯ)' : 'International'}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Language List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Recently Used Section */}
          {!searchQuery && recentLanguages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recently Used</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {recentLanguages.map((lang) => {
                  const isActive = activeCode === lang.code;
                  return (
                    <button
                      key={`recent-${lang.code}`}
                      onClick={() => handleChoose(lang)}
                      className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-bold text-xs text-white truncate">{lang.nativeName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{lang.name}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Languages Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedFamily === 'All' ? 'All Languages' : `${selectedFamily} Languages`}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {filteredLanguages.length} Available
              </span>
            </div>

            {filteredLanguages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No languages match "{searchQuery}". Try searching by English name or native script.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredLanguages.map((lang) => {
                  const isActive = activeCode === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleChoose(lang)}
                      className={`p-3 rounded-xl text-left border transition-all group flex flex-col justify-between space-y-2 ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-white">{lang.nativeName}</span>
                            <span className="text-xs text-slate-400 font-medium">({lang.name})</span>
                          </div>
                          {lang.region && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{lang.region}</div>
                          )}
                        </div>

                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 flex items-center space-x-1 shrink-0">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 shrink-0">
                            {lang.code}
                          </span>
                        )}
                      </div>

                      {/* Capabilities Matrix Pills */}
                      <div className="flex items-center flex-wrap gap-1.5 pt-1 border-t border-slate-800/60 text-[10px] text-slate-400 w-full">
                        {lang.textGenOffline && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Offline Rule
                          </span>
                        )}
                        {lang.textGenOnline && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Cloud AI
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          Voice In/Out
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Saved locally in IndexedDB across browser reloads</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
