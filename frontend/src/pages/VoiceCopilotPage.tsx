import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RefreshCw, 
  Send, 
  Image as ImageIcon, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  Wifi, 
  WifiOff,
  Radio,
  BookOpen,
  MessageSquare,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { languageService, SUPPORTED_LANGUAGES } from '../services/languageService';
import { speechService, type SpeechEvent } from '../services/speechService';
import { aiProviderService, type AIProviderStatus } from '../services/aiProviderService';
import { db } from '../db';
import type { VoiceMessage, OperatingMode } from '../types';

export const VoiceCopilotPage: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<string>(languageService.getLanguage());
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
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [attachedPhotoUrl, setAttachedPhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const strings = languageService.getStrings(selectedLang);
  const currentLangConfig = languageService.getLanguageConfig(selectedLang);

  // Initialize and load saved conversation
  useEffect(() => {
    const unsubLang = languageService.subscribe(lang => {
      setSelectedLang(lang);
      speechService.setLanguage(lang);
    });

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
          // Initial welcome message in selected language
          const welcomeReplies: Record<string, string> = {
            'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಆಫ್‌ಲೈನ್ ಕೃಷಿ ಮತ್ತು ಫೀಲ್ಡ್ ಸಹಾಯಕ. ಅಡಿಕೆ, ಭತ್ತ, ರಾಗಿ, ಟೊಮೆಟೊ ಬೆಳೆಗಳ ರೋಗ, ಕೀಟ ಬಾಧೆ ಅಥವಾ ನೀರಿನ ಸಮಸ್ಯೆಗಳ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ ಕೇಳಿ.',
            'hi-IN': 'नमस्ते! मैं आपका ऑफलाइन कृषि और फील्ड सहायक हूं। सुपारी, धान, रागी, टमाटर फसल या जल आपूर्ति के बारे में बोलकर सवाल पूछें।',
            'te-IN': 'నమస్కారం! నేను మీ ఆఫ్‌లైన్ వ్యవసాయ సహాయకుడిని. వరి, పోక, టమాట పంటలు లేదా నీటి సమస్యల గురించి మాట్లాడి అడగండి.',
            'ta-IN': 'வணக்கம்! நான் உங்கள் ஆஃப்லைன் விவசாய உதவியாளர். பாக்கு, நெல், தக்காளி பயிர்கள் அல்லது குடிநீர் சிக்கல்கள் பற்றி பேசி கேளுங்கள்.',
            'en-US': 'Hello! I am your OfflineFirst Voice Copilot. Speak naturally or type questions regarding rural crops (Arecanut, Paddy, Ragi, Tomato) or water infrastructure.'
          };

          const initMsg: VoiceMessage = {
            id: `msg-init-${Date.now()}`,
            role: 'assistant',
            text: welcomeReplies[selectedLang] || welcomeReplies['kn-IN'],
            language: selectedLang,
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
      unsubLang();
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

  // Handle language switch
  const handleSelectLanguage = async (code: string) => {
    setSelectedLang(code);
    await languageService.setLanguage(code);
    speechService.setLanguage(code);
    setShowLanguageModal(false);
  };

  // Push-to-talk press
  const handleStartListening = async () => {
    setTranscript('');
    setInterimTranscript('');
    await speechService.startListening(selectedLang);
  };

  // Push-to-talk release
  const handleStopListening = () => {
    speechService.stopListening();
    // If text was recognized, trigger send
    setTimeout(() => {
      if (textInput.trim() || transcript.trim()) {
        const query = (textInput || transcript).trim();
        handleSendMessage(query);
      }
    }, 400);
  };

  // Send message to AI engine
  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || textInput).trim();
    if (!text && !attachedPhotoUrl) return;

    speechService.stopListening();
    speechService.stopSpeaking();

    const userMsg: VoiceMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: text || 'Photo query attached',
      language: selectedLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photo_url: attachedPhotoUrl || undefined
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setTextInput('');
    setTranscript('');
    setInterimTranscript('');
    const photoToSend = attachedPhotoUrl;
    setAttachedPhotoUrl(null);
    setIsProcessing(true);

    try {
      const response = await aiProviderService.sendChatMessage(
        text,
        selectedLang,
        messages
      );

      const assistantMsg: VoiceMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        text: response.reply,
        language: selectedLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider_used: response.providerUsed,
        sources: response.verifiedSources
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);

      // Persist conversation to IndexedDB
      await db.voiceConversations.put({
        id: 'active_session',
        language: selectedLang,
        messages: finalMessages,
        updated_at: new Date().toISOString()
      });

      // Spoken response
      speechService.speak(response.reply, selectedLang);
    } catch (err: any) {
      const errMsg: VoiceMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        text: `Error processing query: ${err?.message || 'Local knowledge fallback unavailable.'}`,
        language: selectedLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Replay speech
  const handleReplay = (text: string) => {
    speechService.speak(text, selectedLang);
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
                    Multilingual
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  {strings.tagline}
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Language Selector Button + Mode Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowLanguageModal(true)}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
            >
              <span className="text-base">🌐</span>
              <span className="font-semibold text-white">{currentLangConfig.nativeName}</span>
              <span className="text-[11px] text-slate-400">({currentLangConfig.name})</span>
            </button>

            {/* Operating Mode Indicator */}
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
              title={strings.newConversation}
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
                            title={strings.replay}
                            className="p-1 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          {msg.provider_used && (
                            <span className="font-mono text-[10px] text-slate-400">
                              {msg.provider_used.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sources Badge */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-emerald-400 font-mono">
                        <span className="font-bold text-slate-300">Verified Provenance: </span>
                        {msg.sources.join(' | ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Live Recognition or AI Processing State */}
              {isProcessing && (
                <div className="flex items-center space-x-3 text-sm text-cyan-400 bg-slate-900/60 border border-cyan-500/30 p-3 rounded-xl w-fit animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>{strings.processing}</span>
                </div>
              )}

              {interimTranscript && isRecording && (
                <div className="flex items-center space-x-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl w-fit">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="italic">{interimTranscript}...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Speaking / Audio Wave Status Indicator */}
            {isSpeaking && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                  <span className="font-semibold">{strings.speaking}</span>
                </div>
                <button
                  onClick={() => speechService.stopSpeaking()}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium"
                >
                  {strings.stop}
                </button>
              </div>
            )}

            {/* Input Bar Area */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              
              {/* Photo preview chip if attached */}
              {attachedPhotoUrl && (
                <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg w-fit text-xs text-slate-300">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[150px]">Crop Photo Attached</span>
                  <button 
                    onClick={() => setAttachedPhotoUrl(null)} 
                    className="text-rose-400 hover:text-rose-300 font-bold ml-1"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                
                {/* Photo attachment button */}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach crop observation photo"
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-emerald-400 transition-all"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                {/* Text input for hybrid typing or speech preview */}
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isRecording ? strings.listening : `${currentLangConfig.sampleQuery}...`}
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
                      <span>{strings.listening}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>{strings.pushToTalk}</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Press and hold to speak • Automatic translation to {currentLangConfig.nativeName}
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
              <span>{strings.verifiedKnowledge}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curated offline agricultural advisories verified by UAS Bangalore & ICAR research stations.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Arecanut (ಅಡಿಕೆ)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Koleroga (Fruit rot) & 1% Bordeaux mixture prophylaxis.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Paddy (ಭತ್ತ)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Blast disease moisture & balanced nitrogen fertilizer control.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Tomato & Ragi</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Whitefly yellow sticky traps & certified seed treatments.</div>
              </div>
            </div>
          </div>

          {/* Quick Click Sample Queries */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>{strings.samplePromptsTitle}</span>
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

      {/* Accessible Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-slate-700 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{strings.selectLanguage}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose your native language for natural voice-to-voice interaction.
                </p>
              </div>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-white">{lang.nativeName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        #{lang.priority}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{lang.name}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
