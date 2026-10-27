import { db } from '../db';
import type { OperatingMode, VoiceMessage } from '../types';
import { queryLocalKnowledge } from './localKnowledgeService';
import { networkSimulator } from './networkSimulator';

export interface AIProviderStatus {
  mode: OperatingMode;
  isBackendReachable: boolean;
  geminiConfigured: boolean;
  activeProvider: string;
}

export interface ChatResponse {
  reply: string;
  providerUsed: string;
  executionMode: OperatingMode;
  suggestedFollowUps: string[];
  verifiedSources: string[];
  error?: string;
}

class AIProviderService {
  private mode: OperatingMode = 'hybrid';
  private isBackendReachable: boolean = false;
  private geminiConfigured: boolean = false;
  private listeners: Array<(status: AIProviderStatus) => void> = [];

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const saved = await db.settings.get('operating_mode');
      if (saved && saved.value) {
        this.mode = saved.value as OperatingMode;
      }
    } catch {
      this.mode = 'hybrid';
    }
    this.checkBackendStatus();
    setInterval(() => this.checkBackendStatus(), 20000);
  }

  public getMode(): OperatingMode {
    return this.mode;
  }

  public async setMode(newMode: OperatingMode): Promise<void> {
    this.mode = newMode;
    try {
      await db.settings.put({ key: 'operating_mode', value: newMode });
    } catch (err) {
      console.warn('Failed to save operating mode in DB:', err);
    }
    this.notify();
  }

  public async checkBackendStatus(): Promise<void> {
    if (!networkSimulator.isEffectivelyOnline()) {
      this.isBackendReachable = false;
      this.notify();
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/ai/status', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.isBackendReachable = true;
        this.geminiConfigured = !!data.gemini_configured;
      } else {
        this.isBackendReachable = false;
      }
    } catch {
      this.isBackendReachable = false;
    }
    this.notify();
  }

  public async sendChatMessage(
    prompt: string,
    language: string = 'kn-IN',
    history: VoiceMessage[] = []
  ): Promise<ChatResponse> {
    // 1. Strict Offline Mode Enforcement
    if (this.mode === 'strict_offline') {
      const localMatch = queryLocalKnowledge(prompt, language);
      if (localMatch) {
        return {
          reply: `[Strict Offline Mode]\n${localMatch.advice}`,
          providerUsed: 'local_knowledge',
          executionMode: 'strict_offline',
          suggestedFollowUps: localMatch.clarifyingQuestions,
          verifiedSources: [`${localMatch.entry.provenance} (${localMatch.entry.source})`]
        };
      }
      return {
        reply: `Strict Offline mode is active. Cloud AI is disabled. For guidance on crops (Arecanut, Paddy, Ragi, Tomato) or water pumps, state your observation.`,
        providerUsed: 'offline_rule',
        executionMode: 'strict_offline',
        suggestedFollowUps: ['Arecanut fruit rot', 'Paddy blast symptoms', 'Borewell hand pump repair'],
        verifiedSources: []
      };
    }

    // 2. Hybrid Mode: Prioritize local verified knowledge first
    const localMatch = queryLocalKnowledge(prompt, language);

    // 3. Remote Backend Call (if Hybrid and online, or Online mode)
    if (networkSimulator.isEffectivelyOnline()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const payload = {
          prompt,
          language,
          history: history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            content: h.text
          })),
          mode: this.mode
        };

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          return {
            reply: data.reply,
            providerUsed: data.provider_used,
            executionMode: this.mode,
            suggestedFollowUps: data.suggested_follow_ups || [],
            verifiedSources: data.verified_sources || []
          };
        }
      } catch (err: any) {
        console.warn('Online AI chat request failed, falling back to local:', err);
      }
    }

    // 4. Fallback if backend unreachable or failed
    if (localMatch) {
      return {
        reply: `Notice: Backend offline. Verified Local Knowledge:\n${localMatch.advice}`,
        providerUsed: 'local_knowledge',
        executionMode: this.mode,
        suggestedFollowUps: localMatch.clarifyingQuestions,
        verifiedSources: [`${localMatch.entry.provenance} (${localMatch.entry.source})`]
      };
    }

    const fallbacks: Record<string, string> = {
      'kn-IN': 'ಆಫ್‌ಲೈನ್ ಕೃಷಿ ಸಹಾಯವಾಣಿ. ದಯವಿಟ್ಟು ಬೆಳೆ (ಅಡಿಕೆ, ಭತ್ತ, ರಾಗಿ, ಟೊಮೆಟೊ) ಅಥವಾ ನೀರಿನ ಸಮಸ್ಯೆಯನ್ನು ವಿವರವಾಗಿ ತಿಳಿಸಿ.',
      'hi-IN': 'ऑफलाइन कृषि सहायता। कृपया अपनी फसल (सुपारी, धान, रागी, टमाटर) या समस्या का विवरण दें।',
      'te-IN': 'ఆఫ్‌లైన్ వ్యవసాయ సహాయం. దయచేసి మీ పంట లేదా సమస్యను వివరంగా పేర్కొనండి.',
      'ta-IN': 'ஆஃப்லைன் விவசாய உதவி. பயிர் அல்லது சிக்கல் விவரங்களைக் குறிப்பிடவும்.',
      'en-US': 'Offline field guidance. Please state your crop (Arecanut, Paddy, Ragi, Tomato) or water infrastructure issue.'
    };

    return {
      reply: fallbacks[language] || fallbacks['kn-IN'],
      providerUsed: 'offline_rule',
      executionMode: this.mode,
      suggestedFollowUps: ['Arecanut Koleroga', 'Paddy blast', 'Borewell pump repair'],
      verifiedSources: []
    };
  }

  public async analyzeReport(report: {
    title: string;
    description: string;
    category?: string;
    severity?: string;
    notes?: string;
  }): Promise<{
    summary: string;
    suggestedCategory: string;
    suggestedSeverity: string;
    missingInfo: string[];
    supervisorNotes: string;
    providerUsed: string;
  }> {
    // If online, call backend endpoint
    if (this.mode !== 'strict_offline' && networkSimulator.isEffectivelyOnline()) {
      try {
        const res = await fetch('/api/ai/analyze-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: report.title,
            description: report.description,
            category: report.category,
            severity: report.severity,
            notes: report.notes,
            mode: this.mode
          })
        });

        if (res.ok) {
          const data = await res.json();
          return {
            summary: data.summary,
            suggestedCategory: data.suggested_category,
            suggestedSeverity: data.suggested_severity,
            missingInfo: data.missing_information || [],
            supervisorNotes: data.supervisor_notes,
            providerUsed: data.provider_used
          };
        }
      } catch (err) {
        console.warn('Backend report analysis failed, using local rule fallback:', err);
      }
    }

    // Local deterministic analysis fallback
    const text = `${report.title} ${report.description} ${report.notes || ''}`.toLowerCase();
    let cat = report.category || 'infrastructure';
    if (text.includes('water') || text.includes('pump') || text.includes('pipe') || text.includes('tank')) {
      cat = 'water_supply';
    } else if (text.includes('crop') || text.includes('paddy') || text.includes('canal') || text.includes('pest')) {
      cat = 'agriculture';
    } else if (text.includes('clinic') || text.includes('health') || text.includes('medicine')) {
      cat = 'healthcare';
    }

    let sev = report.severity || 'medium';
    if (text.includes('critical') || text.includes('emergency') || text.includes('collapse') || text.includes('danger')) {
      sev = 'critical';
    } else if (text.includes('broken') || text.includes('severe') || text.includes('school')) {
      sev = 'high';
    }

    const missing: string[] = [];
    if (report.description.trim().length < 25) {
      missing.push('Detailed description of structural or physical damage');
    }
    if (!text.includes('near') && !text.includes('gate') && !text.includes('sector') && !text.includes('village')) {
      missing.push('Specific landmark or geographical reference');
    }

    return {
      summary: `Field report regarding ${report.title}. Classifed under ${cat.replace('_', ' ')} with ${sev.toUpperCase()} priority.`,
      suggestedCategory: cat,
      suggestedSeverity: sev,
      missingInfo: missing,
      supervisorNotes: `Dispatch ${cat.replace('_', ' ')} maintenance team. Confirm on-site physical evidence before resolving.`,
      providerUsed: 'offline_heuristic'
    };
  }

  public subscribe(listener: (status: AIProviderStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const status: AIProviderStatus = {
      mode: this.mode,
      isBackendReachable: this.isBackendReachable,
      geminiConfigured: this.geminiConfigured,
      activeProvider: this.mode === 'strict_offline' ? 'Offline Local Knowledge' : this.geminiConfigured && this.isBackendReachable ? 'Google Gemini AI' : 'Hybrid Local Knowledge'
    };
    this.listeners.forEach(l => l(status));
  }
}

export const aiProviderService = new AIProviderService();
