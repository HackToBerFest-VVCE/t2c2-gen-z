/**
 * Multilingual Speech Processing Service
 * Provides Speech-to-Text (STT) and Text-to-Speech (TTS)
 * Supports Kannada, Hindi, Telugu, Tamil, and English.
 * Safely releases audio resources, prevents feedback loops, and provides graceful fallbacks.
 */

export type SpeechState = 'idle' | 'listening' | 'recognizing' | 'speaking' | 'error';

export interface SpeechEvent {
  state: SpeechState;
  transcript?: string;
  interimTranscript?: string;
  error?: string;
}

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private currentLanguage: string = 'kn-IN';
  private mediaStream: MediaStream | null = null;
  private listeners: Array<(event: SpeechEvent) => void> = [];

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }

  public isRecognitionSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  public setLanguage(langCode: string) {
    this.currentLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  public async startListening(langCode?: string): Promise<void> {
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    const lang = langCode || this.currentLanguage;
    this.setLanguage(lang);

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      this.notify({
        state: 'error',
        error: 'Speech recognition is not supported in this browser. Please use text input or standard Chrome/Edge.'
      });
      return;
    }

    try {
      // Request mic permission and track stream for clean release
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      this.notify({
        state: 'error',
        error: 'Microphone permission denied or unavailable.'
      });
      return;
    }

    this.isListening = true;
    this.notify({ state: 'listening', transcript: '', interimTranscript: '' });

    this.recognition.onstart = () => {
      this.isListening = true;
      this.notify({ state: 'listening' });
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      this.notify({
        state: final ? 'recognizing' : 'listening',
        transcript: final,
        interimTranscript: interim
      });
    };

    this.recognition.onerror = (event: any) => {
      this.cleanupMediaStream();
      this.isListening = false;
      this.notify({
        state: 'error',
        error: event.error === 'no-speech' ? 'No speech detected. Please speak clearly.' : `Speech error: ${event.error}`
      });
    };

    this.recognition.onend = () => {
      this.cleanupMediaStream();
      this.isListening = false;
      this.notify({ state: 'idle' });
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      this.cleanupMediaStream();
      this.isListening = false;
      this.notify({ state: 'idle' });
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
    }
    this.cleanupMediaStream();
    this.isListening = false;
  }

  public cancel(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (err) {
        console.warn('Error aborting recognition:', err);
      }
    }
    this.stopSpeaking();
    this.cleanupMediaStream();
    this.isListening = false;
    this.notify({ state: 'idle' });
  }

  private cleanupMediaStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  public getVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    if (!this.isSynthesisSupported()) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const target = langCode.toLowerCase();
    const prefix = langCode.split('-')[0].toLowerCase();

    // 1. Exact match (e.g., 'kn-IN' or 'en-US')
    const exact = voices.find(v => v.lang.toLowerCase() === target);
    if (exact) return exact;

    // 2. Prefix match (e.g., 'kn' or 'hi')
    const prefixMatch = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (prefixMatch) return prefixMatch;

    return null;
  }

  public hasVoiceForLanguage(langCode: string): boolean {
    return this.getVoiceForLanguage(langCode) !== null;
  }

  public speak(text: string, langCode?: string, onEnd?: () => void): void {
    if (!this.isSynthesisSupported()) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();
    const lang = langCode || this.currentLanguage;

    // Clean markdown or bracketed tags before speaking
    const cleanText = text
      .replace(/\[.*?\]/g, '')
      .replace(/[*#_`]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly slower for clarity in rural and agricultural terms

    // Attempt to match installed voice for the target language
    const matchingVoice = this.getVoiceForLanguage(lang);
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    this.isSpeaking = true;
    this.notify({ state: 'speaking', transcript: cleanText });

    utterance.onend = () => {
      this.isSpeaking = false;
      this.notify({ state: 'idle' });
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      console.warn('Speech synthesis error:', err);
      this.isSpeaking = false;
      this.notify({ state: 'idle' });
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.isSynthesisSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.notify({ state: 'idle' });
  }

  public subscribe(listener: (event: SpeechEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(event: SpeechEvent): void {
    this.listeners.forEach(l => l(event));
  }
}

export const speechService = new SpeechService();
