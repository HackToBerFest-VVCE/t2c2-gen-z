import { db } from '../db/index.ts';
import type { LanguageConfig } from '../types/index.ts';

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    priority: 1,
    sampleQuery: 'ಅಡಿಕೆ ಬೆಳೆಯಲ್ಲಿ ಕೊಳೆ ರೋಗ ಬಂದಿದೆ, ಏನು ಮಾಡಬೇಕು?'
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    priority: 2,
    sampleQuery: 'धान में पत्ती झुलसा रोग के लक्षण और उपाय क्या हैं?'
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    priority: 3,
    sampleQuery: 'వరి పంటలో అగ్గి తెగులు నివారణ చర్యలు ఏమిటి?'
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    priority: 4,
    sampleQuery: 'நெல் பயிரில் குலை நோய் கட்டுப்பாடு முறைகள் என்ன?'
  },
  {
    code: 'en-US',
    name: 'English',
    nativeName: 'English (Rural Advisory)',
    priority: 5,
    sampleQuery: 'How to control fruit rot disease in arecanut plantation?'
  }
];

export const LANGUAGE_DICTIONARY: Record<string, {
  tagline: string;
  pushToTalk: string;
  listening: string;
  processing: string;
  speaking: string;
  replay: string;
  stop: string;
  cancel: string;
  repeatQuestion: string;
  newConversation: string;
  selectLanguage: string;
  verifiedKnowledge: string;
  offlineNotice: string;
  samplePromptsTitle: string;
}> = {
  'kn-IN': {
    tagline: 'ಸಹಜವಾಗಿ ಮಾತನಾಡಿ, ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲೇ ಉತ್ತರ ಪಡೆಯಿರಿ',
    pushToTalk: 'ಮಾತನಾಡಲು ಒತ್ತಿ ಹಿಡಿಯಿರಿ',
    listening: 'ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಮಾತನಾಡಿ',
    processing: 'ಉತ್ತರ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...',
    speaking: 'ಉತ್ತರಿಸಲಾಗುತ್ತಿದೆ...',
    replay: 'ಮತ್ತೊಮ್ಮೆ ಆಲಿಸಿ',
    stop: 'ನಿಲ್ಲಿಸಿ',
    cancel: 'ರದ್ದುಗೊಳಿಸಿ',
    repeatQuestion: 'ಪ್ರಶ್ನೆ ಪುನರಾವರ್ತಿಸಿ',
    newConversation: 'ಹೊಸ ಸಂಭಾಷಣೆ',
    selectLanguage: 'ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
    verifiedKnowledge: 'ದೃಢೀಕರಿಸಿದ ಕೃಷಿ ಜ್ಞಾನ',
    offlineNotice: 'ಆಫ್‌ಲೈನ್ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ',
    samplePromptsTitle: 'ಮಾದರಿ ಪ್ರಶ್ನೆಗಳು'
  },
  'hi-IN': {
    tagline: 'सहजता से बोलें, अपनी भाषा में समाधान पाएं',
    pushToTalk: 'बोलने के लिए दबाएं',
    listening: 'सुन रहे हैं... बोलिए',
    processing: 'उत्तर तैयार हो रहा है...',
    speaking: 'उत्तर दिया जा रहा है...',
    replay: 'फिर से सुनें',
    stop: 'रोकें',
    cancel: 'रद्द करें',
    repeatQuestion: 'प्रश्न दोहराएं',
    newConversation: 'नई बातचीत',
    selectLanguage: 'भाषा चुनें',
    verifiedKnowledge: 'सत्यापित कृषि ज्ञान',
    offlineNotice: 'ऑफलाइन मोड सक्रिय है',
    samplePromptsTitle: 'उदाहरण प्रश्न'
  },
  'te-IN': {
    tagline: 'సహజంగా మాట్లాడండి, మీ భాషలోనే సమాధానాలు పొందండి',
    pushToTalk: 'మాట్లాడటానికి నొక్కండి',
    listening: 'వింటున్నాము... మాట్లాడండి',
    processing: 'సమాధానం సిద్ధమవుతోంది...',
    speaking: 'సమాధానం ఇస్తోంది...',
    replay: 'మళ్ళీ వినండి',
    stop: 'ఆపండి',
    cancel: 'రద్దు చేయండి',
    repeatQuestion: 'ప్రశ్నను పునరావృతం చేయండి',
    newConversation: 'కొత్త సంభాషణ',
    selectLanguage: 'భాషను ఎంచుకోండి',
    verifiedKnowledge: 'ధృవీకరించబడిన వ్యవసాయ సమాచారం',
    offlineNotice: 'ఆఫ్‌లైన్ మోడ్ యాక్టివ్‌గా ఉంది',
    samplePromptsTitle: 'నమూనా ప్రశ్నలు'
  },
  'ta-IN': {
    tagline: 'இயற்கையாகப் பேசுங்கள், உங்கள் மொழியிலேயே பதில்களைப் பெறுங்கள்',
    pushToTalk: 'பேச அழுத்தவும்',
    listening: 'கேட்கிறது... பேசுங்கள்',
    processing: 'பதில் தயாராகிறது...',
    speaking: 'பதில் அளிக்கிறது...',
    replay: 'மீண்டும் கேட்கவும்',
    stop: 'நிறுத்து',
    cancel: 'ரத்து செய்',
    repeatQuestion: 'கேள்வியை மீண்டும் சொல்லுங்கள்',
    newConversation: 'புதிய உரையாடல்',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    verifiedKnowledge: 'சரிபார்க்கப்பட்ட வேளாண்மை அறிவு',
    offlineNotice: 'ஆஃப்லைன் முறை செயலில் உள்ளது',
    samplePromptsTitle: 'மாதிரி கேள்விகள்'
  },
  'en-US': {
    tagline: 'Speak naturally, get verified answers in your language',
    pushToTalk: 'Hold to Speak / Click to Record',
    listening: 'Listening... speak clearly',
    processing: 'Generating response...',
    speaking: 'Speaking response...',
    replay: 'Replay Audio',
    stop: 'Stop Speaking',
    cancel: 'Cancel',
    repeatQuestion: 'Repeat Question',
    newConversation: 'New Conversation',
    selectLanguage: 'Select Language',
    verifiedKnowledge: 'Verified Agricultural Knowledge',
    offlineNotice: 'Strict Offline Mode Active',
    samplePromptsTitle: 'Sample Queries'
  }
};

class LanguageService {
  private currentLanguage: string = 'kn-IN';
  private listeners: Array<(lang: string) => void> = [];

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const setting = await db.settings.get('voice_copilot_language');
      if (setting && setting.value) {
        this.currentLanguage = setting.value;
      } else {
        this.currentLanguage = 'kn-IN';
      }
    } catch {
      this.currentLanguage = 'kn-IN';
    }
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  public async setLanguage(code: string): Promise<void> {
    this.currentLanguage = code;
    try {
      await db.settings.put({ key: 'voice_copilot_language', value: code });
    } catch (err) {
      console.warn('Failed to save language preference to IndexedDB:', err);
    }
    this.notify();
  }

  public getLanguageConfig(code?: string): LanguageConfig {
    const target = code || this.currentLanguage;
    return SUPPORTED_LANGUAGES.find(l => l.code === target) || SUPPORTED_LANGUAGES[0];
  }

  public getStrings(code?: string) {
    const target = code || this.currentLanguage;
    return LANGUAGE_DICTIONARY[target] || LANGUAGE_DICTIONARY['kn-IN'];
  }

  public subscribe(listener: (lang: string) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentLanguage));
  }
}

export const languageService = new LanguageService();
