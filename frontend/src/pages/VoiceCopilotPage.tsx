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

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  badge: string;
  welcome: string;
  placeholder: string;
  sampleQueries: Array<{ label: string; text: string }>;
}

const SUPPORTED_COPILOT_LANGUAGES: LanguageOption[] = [
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    badge: '1. ಕನ್ನಡ (Kannada)',
    welcome: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಆಫ್‌ಲೈನ್ ಕೃಷಿ ಮತ್ತು ಫೀಲ್ಡ್ ಸಹಾಯಕ. ಅಡಿಕೆ, ಭತ್ತ, ರಾಗಿ, ಟೊಮೆಟೊ ಬೆಳೆಗಳ ರೋಗ, ಕೀಟ ಬಾಧೆ ಅಥವಾ ನೀರಿನ ಸಮಸ್ಯೆಗಳ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ ಕೇಳಿ.',
    placeholder: 'ಅಡಿಕೆ ಕೊಳೆ ರೋಗ, ಭತ್ತದ ಬೆಂಕಿ ರೋಗ, ಅಥವಾ ನೀರಿನ ಸಮಸ್ಯೆ ಬಗ್ಗೆ ಕೇಳಿ...',
    sampleQueries: [
      { label: 'ಅಡಿಕೆ ಕೊಳೆ ರೋಗ ಪರಿಹಾರ', text: 'ಅಡಿಕೆ ಬೆಳೆಯಲ್ಲಿ ಕೊಳೆ ರೋಗ ಬಂದಿದೆ, ಬೋರ್ಡೋ ದ್ರಾವಣ ಹೇಗೆ ತಯಾರಿಸಬೇಕು?' },
      { label: 'ಭತ್ತದ ಬೆಂಕಿ ರೋಗ', text: 'ಭತ್ತದ ಎಲೆಗಳಲ್ಲಿ ಚುಕ್ಕೆಗಳು ಕಾಣಿಸಿಕೊಂಡಿವೆ, ಏನು ಮಾಡಬೇಕು?' },
      { label: 'ಕೈಪಂಪು ನೀರು ಬಾರದಿದ್ದರೆ', text: 'ಹಳ್ಳಿಯ ಕೊಳವೆಬಾವಿ ಕೈಪಂಪು ನೀರು ಕೊಡುವುದನ್ನು ನಿಲ್ಲಿಸಿದೆ, ಏನು ಮಾಡಬೇಕು?' },
      { label: 'ಟೊಮೆಟೊ ಎಲೆ ಸುರುಟು', text: 'ಟೊಮೆಟೊ ಗಿಡಗಳ ಎಲೆಗಳು ಮುದುಡಿಕೊಂಡಿವೆ, ಬಿಳಿ ನೊಣ ಹತೋಟಿಗೆ ಏನು ಮಾಡಬೇಕು?' }
    ]
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    badge: '2. हिन्दी (Hindi)',
    welcome: 'नमस्ते! मैं आपका ऑफ़लाइन कृषि और फील्ड सहायक हूँ। सुपारी, धान, रागी, टमाटर फसल या जल समस्या के बारे में बोलकर सवाल पूछें।',
    placeholder: 'सुपारी फल सड़न, धान ब्लास्ट या बोरवेल हैंडपंप के बारे में पूछें...',
    sampleQueries: [
      { label: 'सुपारी फल सड़न रोग', text: 'सुपारी की फसल में कोल्लेरोगा फल सड़न रोग है, बोर्डो मिश्रण कैसे बनाएं?' },
      { label: 'धान पत्ती झुलसा', text: 'धान के पत्तों पर भूरे धब्बे दिखाई दे रहे हैं, क्या उपाय करें?' },
      { label: 'हैंडपंप पानी समस्या', text: 'गांव का हैंडपंप पानी नहीं दे रहा है, क्या जांचें?' },
      { label: 'टमाटर पत्ती मरोड़', text: 'टमाटर के पत्ते मुड़ रहे हैं, सफेद मक्खी की रोकथाम कैसे करें?' }
    ]
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    badge: '3. తెలుగు (Telugu)',
    welcome: 'నమస్కారం! నేను మీ ఆఫ్‌లైన్ వ్యవసాయ సహాయకుడిని. వరి, పోక, టమాట పంటలు లేదా నీటి సమస్యల గురించి మాట్లాడి అడగండి.',
    placeholder: 'పోక కొలెరోగా, వరి అగ్గి తెగులు లేదా చేతిపంపు గురించి అడగండి...',
    sampleQueries: [
      { label: 'పోక కొలెరోగా తెగులు', text: 'పోక తోటలో కాయ కుళ్లు తెగులు వచ్చింది, బోర్డో మిశ్రమం ఎలా తయారు చేయాలి?' },
      { label: 'వరి అగ్గి తెగులు', text: 'వరి ఆకులపై మచ్చలు కనిపిస్తున్నాయి, నివారణ ఏమిటి?' },
      { label: 'చేతిపంపు నీరు', text: 'గ్రామంలోని బోర్వెల్ చేతిపంపు నీరు ఇవ్వడం లేదు, ఏమి చేయాలి?' },
      { label: 'టమాట ఆకు ముడత', text: 'టమాట ఆకులు ముడుచుకుపోతున్నాయి, తెల్లదోమ నివారణ ఎలా?' }
    ]
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    badge: '4. தமிழ் (Tamil)',
    welcome: 'வணக்கம்! நான் உங்கள் ஆஃப்லைன் விவசாய உதவியாளர். பாக்கு, நெல், தக்காளி பயிர்கள் அல்லது குடிநீர் சிக்கல்கள் பற்றி பேசி கேளுங்கள்.',
    placeholder: 'பாக்கு அழுகல், நெல் குலை நோய் அல்லது கைப்பம்பு பற்றி கேட்கவும்...',
    sampleQueries: [
      { label: 'பாக்கு அழுகல் நோய்', text: 'பாக்கு மரத்தில் கொளரோகா காய் அழுகல் வந்துள்ளது, போர்டோ கலவை எவ்வாறு தயாரிப்பது?' },
      { label: 'நெல் குலை நோய்', text: 'நெல் இலைகளில் புள்ளிகள் தோன்றியுள்ளன, என்ன செய்ய வேண்டும்?' },
      { label: 'கைப்பம்பு பழுது', text: 'கிராமத்து கைப்பம்பில் தண்ணீர் வரவில்லை, என்ன செய்ய வேண்டும்?' },
      { label: 'தக்காளி இலைச்சுருள்', text: 'தக்காளி இலைகள் சுருண்டுள்ளன, வெள்ளை ஈ கட்டுப்பாடு எவ்வாறு?' }
    ]
  },
  {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    badge: '5. English',
    welcome: 'Hello! I am your OfflineFirst Voice Copilot. Speak naturally or type questions regarding rural crops (Arecanut, Paddy, Ragi, Tomato) or water infrastructure.',
    placeholder: 'Ask about Arecanut Koleroga, Paddy blast, or handpump repair...',
    sampleQueries: [
      { label: 'Arecanut Koleroga Advice', text: 'How to control Koleroga fruit rot in arecanut using Bordeaux mixture?' },
      { label: 'Paddy Blast Symptoms', text: 'What are the symptoms and nitrogen fertilizer control for paddy blast?' },
      { label: 'Hand Pump Diagnostic', text: 'Hand pump near school stopped delivering water, what to inspect?' },
      { label: 'Tomato Leaf Curl Virus', text: 'Tomato leaves are curling, how to control whitefly infestation?' }
    ]
  }
];

export const VoiceCopilotPage: React.FC = () => {
  const [selectedLangCode, setSelectedLangCode] = useState<string>('kn-IN');
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

  const activeLangConfig = SUPPORTED_COPILOT_LANGUAGES.find(l => l.code === selectedLangCode) || SUPPORTED_COPILOT_LANGUAGES[0];

  // Initialize and load saved conversation and language
  useEffect(() => {
    const initPage = async () => {
      let langToUse = 'kn-IN';
      try {
        const savedLang = await db.settings.get('voice_copilot_language');
        if (savedLang && savedLang.value) {
          langToUse = savedLang.value as string;
          setSelectedLangCode(langToUse);
        }
      } catch {
        langToUse = 'kn-IN';
      }

      speechService.setLanguage(langToUse);

      try {
        const saved = await db.voiceConversations.orderBy('updated_at').reverse().first();
        if (saved && saved.messages && saved.messages.length > 0) {
          setMessages(saved.messages);
        } else {
          const cfg = SUPPORTED_COPILOT_LANGUAGES.find(l => l.code === langToUse) || SUPPORTED_COPILOT_LANGUAGES[0];
          const initMsg: VoiceMessage = {
            id: `msg-init-${Date.now()}`,
            role: 'assistant',
            text: cfg.welcome,
            language: langToUse,
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

    initPage();

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

    return () => {
      unsubSpeech();
      unsubAI();
      speechService.stopSpeaking();
      speechService.cancel();
    };
  }, []);

  // Handle language switch
  const handleSelectLanguage = async (code: string) => {
    setSelectedLangCode(code);
    speechService.setLanguage(code);
    try {
      await db.settings.put({ key: 'voice_copilot_language', value: code });
    } catch (err) {
      console.warn('Failed to persist language setting:', err);
    }
  };

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Push-to-talk press
  const handleStartListening = async () => {
    setTranscript('');
    setInterimTranscript('');
    await speechService.startListening(selectedLangCode);
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
      language: selectedLangCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photo_url: attachedPhotoUrl || undefined
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setTextInput('');
    setTranscript('');
    setInterimTranscript('');
    setAttachedPhotoUrl(null);
    setIsProcessing(true);

    try {
      const response = await aiProviderService.sendChatMessage(query, selectedLangCode, messages.slice(-4));

      const assistantMsg: VoiceMessage = {
        id: `msg-asst-${Date.now()}`,
        role: 'assistant',
        text: response.reply,
        language: selectedLangCode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider_used: response.providerUsed,
        sources: response.verifiedSources
      };

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);

      // Persist in IndexedDB
      await db.voiceConversations.put({
        id: 'active_session',
        language: selectedLangCode,
        messages: finalMessages,
        updated_at: new Date().toISOString()
      });

      // Spoken response in selected language
      speechService.speak(response.reply, selectedLangCode);
    } catch (err: any) {
      const errMsg: VoiceMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        text: `Error processing query: ${err?.message || 'Local knowledge fallback unavailable.'}`,
        language: selectedLangCode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Replay speech
  const handleReplay = (text: string) => {
    speechService.speak(text, selectedLangCode);
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
                    {activeLangConfig.badge}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Speak naturally, get answers in your language. Verified UAS Bangalore & ICAR rural advisory.
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
              title="New Conversation"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phase 5 Priority Language Selection Bar: 1. Kannada, 2. Hindi, 3. Telugu, 4. Tamil, 5. English */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Voice Language:</span>
          {SUPPORTED_COPILOT_LANGUAGES.map((lang) => {
            const isSelected = selectedLangCode === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white'
                }`}
              >
                <span>{lang.nativeName}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                  ({lang.name})
                </span>
              </button>
            );
          })}
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
                            title="Replay voice response"
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
                        <span className="truncate">Source: {msg.sources.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl w-max">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Preparing advisory response...</span>
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
                  <span className="text-xs text-slate-300">Photograph Attached</span>
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
                  title="Attach crop photograph"
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
                  placeholder={isRecording ? 'Listening...' : activeLangConfig.placeholder}
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
                      <span>Listening... ({activeLangConfig.nativeName})</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Push to Talk ({activeLangConfig.nativeName})</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Press and hold to speak in {activeLangConfig.name} • ICAR & UAS Bangalore Field Guide
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
              <span>Verified Agricultural Knowledge</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curated offline agricultural advisories verified by UAS Bangalore & ICAR research stations.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Arecanut (ಅಡಿಕೆ / सुपारी)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Koleroga (Fruit rot) control via 1% Bordeaux mixture prophylaxis.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Paddy (ಭತ್ತ / धान / వరి)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Blast disease management with balanced nitrogen & shallow water.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="font-semibold text-slate-200">Tomato & Ragi</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Yellow sticky traps for whitefly vectors and certified seed treatment.</div>
              </div>
            </div>
          </div>

          {/* Quick Click Sample Queries for Selected Language */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Sample Questions ({activeLangConfig.name})</span>
            </div>
            <div className="space-y-2">
              {activeLangConfig.sampleQueries.map((q, idx) => (
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
