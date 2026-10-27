import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  RefreshCw, 
  Send, 
  Image as ImageIcon, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';
import { speechService, type SpeechEvent } from '../services/speechService';
import { aiProviderService, type AIProviderStatus } from '../services/aiProviderService';
import { db } from '../db';
import type { VoiceMessage } from '../types';

const COPILOT_LANG = 'kn-IN';

export const VoiceCopilotPage: React.FC = () => {
  const [speechState, setSpeechState] = useState<string>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [aiStatus, setAiStatus] = useState<AIProviderStatus>({
    mode: aiProviderService.getMode(),
    isBackendReachable: false,
    geminiConfigured: false,
    activeProvider: 'Local Knowledge Engine'
  });
  const [attachedPhotoUrl, setAttachedPhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and load saved conversation
  useEffect(() => {
    speechService.setLanguage(COPILOT_LANG);

    const unsubSpeech = speechService.subscribe((event: SpeechEvent) => {
      setSpeechState(event.state);
      if (event.transcript) {
        setTranscript(event.transcript);
        setTextInput(event.transcript);
      }
      if (event.interimTranscript !== undefined) {
        setInterimTranscript(event.interimTranscript);
      }
      if (event.error) {
        console.warn('Speech event error:', event.error);
      }
    });

    const unsubAI = aiProviderService.subscribe(status => {
      setAiStatus(status);
    });

    // Load conversation from IndexedDB
    const loadConversation = async () => {
      try {
        const saved = await db.voiceConversations.orderBy('updated_at').reverse().first();
        if (saved && saved.messages && saved.messages.length > 0) {
          setMessages(saved.messages);
        } else {
          const initMsg: VoiceMessage = {
            id: `msg-init-${Date.now()}`,
            role: 'assistant',
            text: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಆಫ್‌ಲೈನ್ ಕೃಷಿ ಮತ್ತು ಫೀಲ್ಡ್ ಸಹಾಯಕ. ಅಡಿಕೆ, ಭತ್ತ, ರಾಗಿ, ಟೊಮೆಟೊ ಬೆಳೆಗಳ ರೋಗ, ಕೀಟ ಬಾಧೆ ಅಥವಾ ನೀರಿನ ಸಮಸ್ಯೆಗಳ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ ಕೇಳಿ.',
            language: COPILOT_LANG,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            provider_used: 'verified_knowledge_engine',
            sources: ['ICAR-CRIDA & UAS Bangalore Field Guide']
          };
          setMessages([initMsg]);
        }
      } catch (err) {
        console.warn('Failed to load conversation history:', err);
      }
    };

    loadConversation();

    return () => {
      unsubSpeech();
      unsubAI();
      speechService.stopSpeaking();
      speechService.cancel();
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Push-to-talk press
  const handleStartListening = async () => {
    setTranscript('');
    setInterimTranscript('');
    await speechService.startListening(COPILOT_LANG);
  };

  // Push-to-talk release
  const handleStopListening = () => {
    speechService.stopListening();
    setTimeout(() => {
      if (textInput.trim() || transcript.trim()) {
        const query = (textInput || transcript).trim();
        handleSendMessage(query);
      }
    }, 400);
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : textInput).trim();
    if (!query && !attachedPhotoUrl) return;

    speechService.stopSpeaking();

    const userMsg: VoiceMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: query || 'Crop photograph query',
      language: COPILOT_LANG,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photo_url: attachedPhotoUrl || undefined
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setTextInput('');
    setTranscript('');
    setInterimTranscript('');
    const photoToSubmit = attachedPhotoUrl;
    setAttachedPhotoUrl(null);
    setIsProcessing(true);

    try {
      const response = await aiProviderService.sendChatMessage(query, COPILOT_LANG, messages.slice(-4));

      const assistantMsg: VoiceMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        text: response.reply,
        language: COPILOT_LANG,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider_used: response.providerUsed,
        sources: response.verifiedSources
      };

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);

      // Persist in IndexedDB
      await db.voiceConversations.put({
        id: 'active_session',
        language: COPILOT_LANG,
        messages: finalMessages,
        updated_at: new Date().toISOString()
      });

      // Spoken response in Kannada
      speechService.speak(response.reply, COPILOT_LANG);
    } catch (err: any) {
      const errMsg: VoiceMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        text: `Error processing query: ${err?.message || 'Local knowledge fallback unavailable.'}`,
        language: COPILOT_LANG,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Replay speech
  const handleReplay = (text: string) => {
    speechService.speak(text, COPILOT_LANG);
  };

  // Clear conversation
  const handleNewConversation = async () => {
    speechService.stopSpeaking();
    speechService.cancel();
    setMessages([]);
    await db.voiceConversations.delete('active_session');
  };

  // Handle Photo Attachment
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isRecording = speechState === 'listening' || speechState === 'recognizing';
  const isSpeaking = speechState === 'speaking';

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                  <span>OfflineFirst Voice Copilot</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ಕನ್ನಡ ಕೃಷಿ ಸಲಹೆಗಾರ
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  ಧ್ವನಿ ಮೂಲಕ ಕನ್ನಡದಲ್ಲಿ ಕೃಷಿ ಮತ್ತು ಪಂಚಾಯತ್ ಸಮಸ್ಯೆಗಳಿಗೆ ಪರಿಹಾರ ಪಡೆದುಕೊಳ್ಳಿ (UAS Bangalore & ICAR).
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Mode Badge + New Conversation */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${
                aiStatus.mode === 'strict_offline' ? 'bg-amber-400 animate-pulse' :
                aiStatus.isBackendReachable ? 'bg-emerald-400' : 'bg-cyan-400'
              }`} />
              <span className="text-slate-300 font-mono text-[11px] uppercase">
                {aiStatus.mode.replace('_', ' ')}
              </span>
            </div>

            <button
              onClick={handleNewConversation}
              title="ಹೊಸ ಸಂಭಾಷಣೆ (New Conversation)"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Conversation Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Chat Flow (3 cols on desktop) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-800 p-4 sm:p-6 min-h-[480px] max-h-[580px] overflow-y-auto flex flex-col justify-between">
            
            {/* Messages List */}
            <div className="space-y-4 flex-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {/* Attached photo in message */}
                    {msg.photo_url && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-white/20 max-w-xs">
                        <img src={msg.photo_url} alt="Attached crop query" className="w-full h-auto object-cover max-h-48" />
                      </div>
                    )}

                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Footer / Provenance Sources */}
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300/80">
                      <span>{msg.timestamp}</span>
                      
                      {msg.role === 'assistant' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleReplay(msg.text)}
                            title="ಮತ್ತೆ ಆಲಿಸಿ (Replay voice)"
                            className="hover:text-emerald-300 transition-colors p-1"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          {msg.provider_used && (
                            <span className="font-mono text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-emerald-300">
                              {msg.provider_used}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sources Badge */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 text-[10px] text-emerald-400/90 flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3 shrink-0" />
                        <span className="truncate">ಮೂಲ: {msg.sources.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl w-max">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>ಕೃಷಿ ಸಲಹೆ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Controls / Push-to-Talk & Text Input */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              
              {/* Photo Preview if attached */}
              {attachedPhotoUrl && (
                <div className="flex items-center space-x-2 p-2 bg-slate-900/90 border border-slate-800 rounded-xl w-max">
                  <img src={attachedPhotoUrl} alt="Draft attachment" className="w-12 h-12 object-cover rounded-lg" />
                  <span className="text-xs text-slate-300">ಫೋಟೋ ಲಗತ್ತಿಸಲಾಗಿದೆ</span>
                  <button 
                    onClick={() => setAttachedPhotoUrl(null)} 
                    className="text-xs text-rose-400 hover:text-rose-300 ml-2 font-bold p-1"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Text Input & Controls */}
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="ಬೆಳೆಯ ಫೋಟೋ ಲಗತ್ತಿಸಿ"
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder={isRecording ? 'ಆಲಿಸುತ್ತಿದೆ...' : 'ಅಡಿಕೆ ಕೊಳೆ ರೋಗ, ಭತ್ತದ ಬೆಂಕಿ ರೋಗ, ಅಥವಾ ನೀರಿನ ಸಮಸ್ಯೆ ಬಗ್ಗೆ ಕೇಳಿ...'}
                  className={`flex-1 bg-slate-900 border px-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                    isRecording 
                      ? 'border-emerald-500 shadow-md shadow-emerald-500/20' 
                      : 'border-slate-800 focus:border-emerald-500/60'
                  }`}
                />

                {/* Text Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!textInput.trim() && !attachedPhotoUrl}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-slate-800 text-white transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Primary Voice Action Bar (Large Accessible Push-to-Talk) */}
              <div className="flex flex-col items-center justify-center pt-2">
                <button
                  onMouseDown={handleStartListening}
                  onMouseUp={handleStopListening}
                  onTouchStart={handleStartListening}
                  onTouchEnd={handleStopListening}
                  className={`relative flex items-center justify-center space-x-3 w-full sm:w-80 py-3.5 px-6 rounded-2xl font-semibold text-base transition-all select-none shadow-xl ${
                    isRecording
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-rose-500/30 scale-105 animate-pulse'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-emerald-500/20 active:scale-95'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5 animate-spin" />
                      <span>ಆಲಿಸುತ್ತಿದೆ... (Listening...)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>ಕೇಳಲು ಒತ್ತಿ ಹಿಡಿಯಿರಿ (Push to Talk)</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ • ICAR & UAS Bangalore ಕೃಷಿ ಮಾರ್ಗದರ್ಶಿ
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* Right Side: Verified Knowledge & Sample Prompts (1 col) */}
        <div className="space-y-4">
          
          {/* Verified Knowledge Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>ಪರಿಶೀಲಿಸಿದ ಕೃಷಿ ಮಾಹಿತಿ</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              ಬೆಂಗಳೂರು ಕೃಷಿ ವಿಶ್ವವಿದ್ಯಾಲಯ (UAS) ಮತ್ತು ICAR ಸಂಶೋಧನಾ ಕೇಂದ್ರಗಳಿಂದ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟ ಆಫ್‌ಲೈನ್ ಕೃಷಿ ಮಾರ್ಗದರ್ಶಿ.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Arecanut (ಅಡಿಕೆ)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">ಕೊಳೆ ರೋಗ ಹತೋಟಿಗೆ 1% ಬೋರ್ಡೋ ದ್ರಾವಣ ಸಿಂಪಡಣೆ.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Paddy (ಭತ್ತ)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">ಬೆಂಕಿ ರೋಗಕ್ಕೆ ಸಮತೋಲಿತ ಸಾರಜನಕ ಮತ್ತು ನೀರಿನ ನಿರ್ವಹಣೆ.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Tomato & Ragi</div>
                <div className="text-[11px] text-slate-400 mt-0.5">ಬಿಳಿ ನೊಣಕ್ಕೆ ಹಳದಿ ಜಿಗುಟು ಬಲೆ ಮತ್ತು ಬಿತ್ತನೆ ಬೀಜೋಪಚಾರ.</div>
              </div>
            </div>
          </div>

          {/* Quick Click Sample Queries */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>ಮಾದರಿ ಪ್ರಶ್ನೆಗಳು</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'ಅಡಿಕೆ ಕೊಳೆ ರೋಗ ಪರಿಹಾರ', text: 'ಅಡಿಕೆ ಬೆಳೆಯಲ್ಲಿ ಕೊಳೆ ರೋಗ ಬಂದಿದೆ, ಬೋರ್ಡೋ ದ್ರಾವಣ ಹೇಗೆ ತಯಾರಿಸಬೇಕು?' },
                { label: 'ಭತ್ತದ ಬೆಂಕಿ ರೋಗ', text: 'ಭತ್ತದ ಎಲೆಗಳಲ್ಲಿ ಚುಕ್ಕೆಗಳು ಕಾಣಿಸಿಕೊಂಡಿವೆ, ಏನು ಮಾಡಬೇಕು?' },
                { label: 'ಕೈಪಂಪು ನೀರು ಬಾರದಿದ್ದರೆ', text: 'ಹಳ್ಳಿಯ ಕೊಳವೆಬಾವಿ ಕೈಪಂಪು ನೀರು ಕೊಡುವುದನ್ನು ನಿಲ್ಲಿಸಿದೆ, ಏನು ಮಾಡಬೇಕು?' },
                { label: 'ಟೊಮೆಟೊ ಎಲೆ ಸುರುಟು', text: 'ಟೊಮೆಟೊ ಗಿಡಗಳ ಎಲೆಗಳು ಮುದುಡಿಕೊಂಡಿವೆ, ಬಿಳಿ ನೊಣ ಹತೋಟಿಗೆ ಏನು ಮಾಡಬೇಕು?' }
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q.text)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span className="font-medium text-[11px]">{q.label}</span>
                  <Send className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
