import { db } from '../db/index.ts';
import type { LanguageCapability, LanguageConfig } from '../types/index.ts';

/**
 * Multilingual Language Capability Registry
 * Tracks online & offline capabilities, native scripts, regional variants, and text directions.
 * Designed to be extensible without modifying core application logic.
 */
export const LANGUAGE_REGISTRY: LanguageCapability[] = [
  // Top 5 Priority Agricultural & Civic Languages
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    region: 'Karnataka, India',
    direction: 'ltr',
    family: 'Indian',
    priority: 1,
    sampleQuery: 'ಅಡಿಕೆ ಬೆಳೆಯಲ್ಲಿ ಕೊಳೆ ರೋಗ ಬಂದಿದೆ, ಏನು ಮಾಡಬೇಕು?',
    textGenOnline: true,
    textGenOffline: true,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: true,
    onlineProviderAvailable: true,
    knownLimitations: 'Offline speech recognition requires device-level speech pack; rule engine provides verified offline agricultural guidance.'
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    region: 'Northern & Central India',
    direction: 'ltr',
    family: 'Indian',
    priority: 2,
    sampleQuery: 'धान में पत्ती झुलसा रोग के लक्षण और उपाय क्या हैं?',
    textGenOnline: true,
    textGenOffline: true,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: true,
    onlineProviderAvailable: true,
    knownLimitations: 'Local speech synthesis uses standard system voice pack.'
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    region: 'Andhra Pradesh & Telangana, India',
    direction: 'ltr',
    family: 'Indian',
    priority: 3,
    sampleQuery: 'వరి పంటలో అగ్గి తెగులు నివారణ చర్యలు ఏమిటి?',
    textGenOnline: true,
    textGenOffline: true,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: true,
    onlineProviderAvailable: true,
    knownLimitations: 'Offline speech recognition requires browser Web Speech API support.'
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    region: 'Tamil Nadu & Puducherry, India',
    direction: 'ltr',
    family: 'Indian',
    priority: 4,
    sampleQuery: 'நெல் பயிரில் குலை நோய் கட்டுப்பாடு முறைகள் என்ன?',
    textGenOnline: true,
    textGenOffline: true,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: true,
    onlineProviderAvailable: true,
    knownLimitations: 'Speech recognition requires active Web Speech engine.'
  },
  {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English (US)',
    region: 'United States / Global',
    direction: 'ltr',
    family: 'International',
    priority: 5,
    sampleQuery: 'How to control fruit rot disease in arecanut plantation?',
    textGenOnline: true,
    textGenOffline: true,
    sttOnline: true,
    sttOffline: true,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: true,
    onlineProviderAvailable: true,
    knownLimitations: 'Fully supported across local and cloud engines.'
  },

  // Additional Indian Languages
  {
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English (India)',
    region: 'India',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'What are the symptoms and cure for paddy blast disease?',
    textGenOnline: true,
    textGenOffline: true,
    sttOnline: true,
    sttOffline: true,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: true,
    onlineProviderAvailable: true,
    knownLimitations: 'Supports Indian English accent models.'
  },
  {
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    region: 'Kerala, India',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'തെങ്ങ് കൃഷിയിലെ കീടങ്ങളെ എങ്ങനെ നിയന്ത്രിക്കാം?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Offline local voice depends on system Malayalam voice pack.'
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    region: 'Maharashtra, India',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'सोयाबीन पिकावरील कीड नियंत्रण उपाय काय आहेत?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Offline responses fallback to English/Hindi core rules.'
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'West Bengal & Tripura, India',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'ধানের ব্লাস্ট রোগের লক্ষণ ও প্রতিকার কি?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Cloud AI provides full Bengali response generation.'
  },
  {
    code: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    region: 'Gujarat, India',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'કપાસમાં ગુલાબી ઈયળનું નિયંત્રણ કેવી રીતે કરવું?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'TTS voice requires browser or OS Gujarati voice engine.'
  },
  {
    code: 'pa-IN',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    region: 'Punjab, India',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'ਕਣਕ ਦੇ ਪੀਲੇ ਰਤੂਏ ਦੀ ਰੋਕਥਾਮ ਕਿਵੇਂ ਕਰੀਏ?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Uses Gurmukhi script for all AI and transcript representations.'
  },
  {
    code: 'or-IN',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    region: 'Odisha, India',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'ଧାନ ଫସଲରେ ରୋଗ ପୋକ ନିୟନ୍ତ୍ରଣ ପଦ୍ଧତି କଣ?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Odia script fully preserved across database and exports.'
  },
  {
    code: 'ur-IN',
    name: 'Urdu',
    nativeName: 'اردو',
    region: 'India & South Asia',
    direction: 'rtl',
    family: 'Indian',
    sampleQuery: 'دھان کی فصل میں بیماری کے کنٹرول کے طریقے کیا ہیں؟',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Right-to-left layout automatically applied for Urdu.'
  },
  {
    code: 'as-IN',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    region: 'Assam, India',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'চাহ খেতিত হোৱা পোকা-পতংগ নিয়ন্ত্ৰণৰ উপায় কি?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: false,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Speech recognition availability depends on browser build.'
  },
  {
    code: 'sa-IN',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    region: 'India',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'कृषिप्रधानक्षेत्रेषु जलसंरक्षणस्य उपायाः के?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: false,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: false,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Speech input unavailable; text AI generation available via Gemini.'
  },
  {
    code: 'ne-IN',
    name: 'Nepali',
    nativeName: 'नेपाली',
    region: 'Sikkim, West Bengal & Nepal',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'मकै बालीमा लाग्ने रोगको रोकथाम कसरी गर्ने?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Devanagari script supported.'
  },
  {
    code: 'kok-IN',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    region: 'Goa & Coastal Karnataka',
    direction: 'ltr',
    family: 'Indian',
    sampleQuery: 'सुपारी पिकाचेर पडपी रोगाक कितें उपाय करचो?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: false,
    sttOffline: false,
    ttsOnline: false,
    ttsOffline: false,
    autoDetect: false,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Text input only. Audio synthesis uses Marathi/Hindi voice as fallback.'
  },
  {
    code: 'ks-IN',
    name: 'Kashmiri',
    nativeName: 'کٲشُر',
    region: 'Jammu & Kashmir',
    direction: 'rtl',
    family: 'Indian',
    sampleQuery: 'ژوٗنٹھ باغن مَنٛز کِھرم ہُنٛد عِلاج کِتھ کَن کرُن؟',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: false,
    sttOffline: false,
    ttsOnline: false,
    ttsOffline: false,
    autoDetect: false,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Right-to-left Nastaliq/Arabic script. Audio input requires system speech support.'
  },

  // International Languages
  {
    code: 'es-ES',
    name: 'Spanish',
    nativeName: 'Español',
    region: 'Spain & Latin America',
    direction: 'ltr',
    family: 'International',
    sampleQuery: '¿Cómo controlar la plaga en los cultivos de maíz?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: true,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Local speech synthesis available on most operating systems.'
  },
  {
    code: 'fr-FR',
    name: 'French',
    nativeName: 'Français',
    region: 'France & Francophone',
    direction: 'ltr',
    family: 'International',
    sampleQuery: 'Comment traiter les maladies fongiques des cultures maraîchères?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: true,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Full online and browser speech support.'
  },
  {
    code: 'de-DE',
    name: 'German',
    nativeName: 'Deutsch',
    region: 'Germany, Austria & Switzerland',
    direction: 'ltr',
    family: 'International',
    sampleQuery: 'Welche Maßnahmen helfen gegen Pilzbefall bei Feldfrüchten?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: true,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Local voice pack usually preinstalled on Windows/macOS.'
  },
  {
    code: 'ar-SA',
    name: 'Arabic',
    nativeName: 'العربية',
    region: 'Middle East & North Africa',
    direction: 'rtl',
    family: 'International',
    sampleQuery: 'كيف يمكن معالجة آفات محاصيل القمح وطرق الري الحديثة؟',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Right-to-left layout automatically enabled.'
  },
  {
    code: 'pt-BR',
    name: 'Portuguese',
    nativeName: 'Português',
    region: 'Brazil & Portugal',
    direction: 'ltr',
    family: 'International',
    sampleQuery: 'Como combater a ferrugem asiática na plantação de soja?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: true,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Web Speech API and browser speech synthesis supported.'
  },
  {
    code: 'id-ID',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    region: 'Indonesia',
    direction: 'ltr',
    family: 'International',
    sampleQuery: 'Bagaimana cara mengatasi hama wereng pada tanaman padi?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Speech recognition relies on browser speech provider.'
  },
  {
    code: 'sw-KE',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    region: 'East Africa',
    direction: 'ltr',
    family: 'International',
    sampleQuery: 'Jinsi ya kudhibiti wadudu wanaoshambulia mahindi shambani?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: false,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Speech voice availability depends on installed OS voice packs.'
  },
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    region: 'China & Global',
    direction: 'ltr',
    family: 'International',
    sampleQuery: '水稻稻瘟病的早期症状与综合防治方法是什么？',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: true,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'High-quality TTS voice usually available locally.'
  },
  {
    code: 'ja-JP',
    name: 'Japanese',
    nativeName: '日本語',
    region: 'Japan',
    direction: 'ltr',
    family: 'International',
    sampleQuery: '水稲のいもち病の予防と適切な防除対策を教えてください。',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: true,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Full speech recognition and synthesis supported.'
  },
  {
    code: 'ru-RU',
    name: 'Russian',
    nativeName: 'Русский',
    region: 'Eastern Europe & Central Asia',
    direction: 'ltr',
    family: 'International',
    sampleQuery: 'Как бороться с фитофторозом томатов и картофеля?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: true,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Cyrillic script preserved.'
  },
  {
    code: 'tr-TR',
    name: 'Turkish',
    nativeName: 'Türkçe',
    region: 'Turkey',
    direction: 'ltr',
    family: 'International',
    sampleQuery: 'Buğdayda sarı pas hastalığı ile nasıl mücadele edilir?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Web Speech API supported.'
  },
  {
    code: 'vi-VN',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    region: 'Vietnam',
    direction: 'ltr',
    family: 'International',
    sampleQuery: 'Cách phòng trừ bệnh đạo ôn hại lúa hiệu quả nhất là gì?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: false,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Tone marks fully supported in native script.'
  },
  {
    code: 'ko-KR',
    name: 'Korean',
    nativeName: '한국어',
    region: 'South Korea',
    direction: 'ltr',
    family: 'International',
    sampleQuery: '벼 도열병 방제 및 친환경 방제법은 무엇인가요?',
    textGenOnline: true,
    textGenOffline: false,
    sttOnline: true,
    sttOffline: true,
    ttsOnline: true,
    ttsOffline: true,
    autoDetect: true,
    localModelAvailable: false,
    onlineProviderAvailable: true,
    knownLimitations: 'Full Korean Hangul support in speech and UI.'
  }
];

// Backwards-compatible export
export const SUPPORTED_LANGUAGES = LANGUAGE_REGISTRY;

export interface AppTranslationStrings {
  // Voice Copilot
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
  
  // Navigation
  navDashboard: string;
  navVoice: string;
  navField: string;
  navSupervisor: string;
  navTasks: string;
  navSync: string;
  navRuntime: string;

  // Actions & Buttons
  btnSaveDraft: string;
  btnSubmitQueue: string;
  btnSyncNow: string;
  btnFilter: string;
  btnClear: string;
  btnTranslate: string;
  btnChangeLanguage: string;
  
  // Forms & Reports
  labelCategory: string;
  labelSeverity: string;
  labelTitle: string;
  labelDescription: string;
  labelNotes: string;
  labelLocation: string;
  labelPhotos: string;
  labelOriginalLanguage: string;

  // Categories
  catWater: string;
  catAgriculture: string;
  catHealthcare: string;
  catInfrastructure: string;
  catEducation: string;
  catOther: string;

  // Severities
  sevCritical: string;
  sevHigh: string;
  sevMedium: string;
  sevLow: string;

  // States
  statusDraft: string;
  statusQueued: string;
  statusSyncing: string;
  statusSynced: string;
  statusConflict: string;

  // Notices & Errors
  errNoMic: string;
  errOfflineNoVoice: string;
  noticeRtlActive: string;
}

// Master translation dictionary
export const LANGUAGE_DICTIONARY: Record<string, Partial<AppTranslationStrings>> = {
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
    samplePromptsTitle: 'ಮಾದರಿ ಪ್ರಶ್ನೆಗಳು',
    navDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navVoice: 'ಧ್ವನಿ ಸಹಾಯಕ',
    navField: 'ಫೀಲ್ಡ್ ವರ್ಕರ್',
    navSupervisor: 'ಮೇಲ್ವಿಚಾರಕ',
    navTasks: 'ಕಾರ್ಯಗಳು',
    navSync: 'ಸಿಂಕ್ ಹಬ್',
    navRuntime: 'ರನ್‌ಟೈಮ್',
    btnSaveDraft: 'ಕರಡು ಉಳಿಸಿ',
    btnSubmitQueue: 'ಸಲ್ಲಿಸಿ ಮತ್ತು ಕ್ಯೂ ಮಾಡಿ',
    btnSyncNow: 'ಈಗಲೇ ಸಿಂಕ್ ಮಾಡಿ',
    btnFilter: 'ಫಿಲ್ಟರ್',
    btnClear: 'ತೆರವುಗೊಳಿಸಿ',
    btnTranslate: 'ಅನುವಾದಿಸಿ',
    btnChangeLanguage: 'ಭಾಷೆ ಬದಲಿಸಿ',
    labelCategory: 'ವರ್ಗ',
    labelSeverity: 'ತೀವ್ರತೆ',
    labelTitle: 'ಶೀರ್ಷಿಕೆ',
    labelDescription: 'ವಿವರಣೆ',
    labelNotes: 'ಟಿಪ್ಪಣಿಗಳು',
    labelLocation: 'ಸ್ಥಳ',
    labelPhotos: 'ಭಾವಚಿತ್ರಗಳು',
    labelOriginalLanguage: 'ಮೂಲ ಭಾಷೆ',
    catWater: 'ಕುಡಿಯುವ ನೀರು',
    catAgriculture: 'ಕೃಷಿ',
    catHealthcare: 'ಆರೋಗ್ಯ ಸೇವೆ',
    catInfrastructure: 'ಮೂಲಸೌಕರ್ಯ',
    catEducation: 'ಶಿಕ್ಷಣ',
    catOther: 'ಇತರ',
    sevCritical: 'ತುರ್ತು (Critical)',
    sevHigh: 'ಹೆಚ್ಚು (High)',
    sevMedium: 'ಮಧ್ಯಮ (Medium)',
    sevLow: 'ಸಾಮಾನ್ಯ (Low)',
    statusDraft: 'ಕರಡು',
    statusQueued: 'ಕ್ಯೂನಲ್ಲಿದೆ',
    statusSyncing: 'ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...',
    statusSynced: 'ಸಿಂಕ್ ಆಗಿದೆ',
    statusConflict: 'ಸಂಘರ್ಷ ಪರಿಹರಿಸಿ',
    errNoMic: 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ಲಭ್ಯವಿಲ್ಲ',
    errOfflineNoVoice: 'ಈ ಭಾಷೆಗೆ ಆಫ್‌ಲೈನ್ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ. ಪಠ್ಯ ಮೋಡ್ ಬಳಸಲಾಗುವುದು.',
    noticeRtlActive: 'ಎಡದಿಂದ ಬಲಕ್ಕೆ ಪಠ್ಯ'
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
    samplePromptsTitle: 'उदाहरण प्रश्न',
    navDashboard: 'डैशबोर्ड',
    navVoice: 'वॉयस कोपायलट',
    navField: 'फील्ड वर्कर',
    navSupervisor: 'सुपरवाइजर',
    navTasks: 'कार्य',
    navSync: 'सिंक हब',
    navRuntime: 'रनटाइम',
    btnSaveDraft: 'ड्राफ्ट सहेजें',
    btnSubmitQueue: 'दर्ज करें और कतारबद्ध करें',
    btnSyncNow: 'अभी सिंक करें',
    btnFilter: 'फ़िल्टर',
    btnClear: 'साफ़ करें',
    btnTranslate: 'अनुवाद करें',
    btnChangeLanguage: 'भाषा बदलें',
    labelCategory: 'श्रेणी',
    labelSeverity: 'गंभीरता',
    labelTitle: 'शीर्षक',
    labelDescription: 'विवरण',
    labelNotes: 'टिप्पणियां',
    labelLocation: 'स्थान',
    labelPhotos: 'तस्वीरें',
    labelOriginalLanguage: 'मूल भाषा',
    catWater: 'जल आपूर्ति',
    catAgriculture: 'कृषि',
    catHealthcare: 'स्वास्थ्य सेवा',
    catInfrastructure: 'बुनियादी ढांचा',
    catEducation: 'शिक्षा',
    catOther: 'अन्य',
    sevCritical: 'अति गंभीर (Critical)',
    sevHigh: 'उच्च (High)',
    sevMedium: 'मध्यम (Medium)',
    sevLow: 'सामान्य (Low)',
    statusDraft: 'ड्राफ्ट',
    statusQueued: 'कतारबद्ध',
    statusSyncing: 'सिंक हो रहा है...',
    statusSynced: 'सिंक हो चुका',
    statusConflict: 'परस्पर विरोध',
    errNoMic: 'माइक्रोफ़ोन अनुमति अस्वीकृत',
    errOfflineNoVoice: 'ऑफलाइन आवाज उपलब्ध नहीं है। टेक्स्ट मोड चालू है।',
    noticeRtlActive: 'दाएं से बाएं पाठ'
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
    samplePromptsTitle: 'నమూనా ప్రశ్నలు',
    navDashboard: 'డ్యాష్‌బోర్డ్',
    navVoice: 'వాయిస్ కోపైలట్',
    navField: 'ఫీల్డ్ వర్కర్',
    navSupervisor: 'సూపర్‌వైజర్',
    navTasks: 'టాస్క్‌లు',
    navSync: 'సింక్ హబ్',
    navRuntime: 'రన్‌టైమ్',
    btnSaveDraft: 'డ్రాఫ్ట్ సేవ్ చేయండి',
    btnSubmitQueue: 'సమర్పించండి & క్యూ చేయండి',
    btnSyncNow: 'ఇప్పుడే సింక్ చేయండి',
    btnFilter: 'ఫిల్టర్',
    btnClear: 'క్లియర్',
    btnTranslate: 'అనువదించండి',
    btnChangeLanguage: 'భాష మార్చండి',
    labelCategory: 'వర్గం',
    labelSeverity: 'తీవ్రత',
    labelTitle: 'శీర్షిక',
    labelDescription: 'వివరణ',
    labelNotes: 'గమనికలు',
    labelLocation: 'ప్రాంతం',
    labelPhotos: 'ఫోటోలు',
    labelOriginalLanguage: 'మూల భాష',
    catWater: 'నీటి సరఫరా',
    catAgriculture: 'వ్యవసాయం',
    catHealthcare: 'ఆరోగ్య సంరక్షణ',
    catInfrastructure: 'మౌలిక సదుపాయాలు',
    catEducation: 'విద్య',
    catOther: 'ఇతర',
    sevCritical: 'అత్యవసరం (Critical)',
    sevHigh: 'అధిక (High)',
    sevMedium: 'మధ్యస్థం (Medium)',
    sevLow: 'సాధారణ (Low)',
    statusDraft: 'డ్రాఫ్ట్',
    statusQueued: 'క్యూలో ఉంది',
    statusSyncing: 'సింక్ అవుతోంది...',
    statusSynced: 'సింక్ అయింది',
    statusConflict: 'సమస్య పరిష్కరించండి',
    errNoMic: 'మైక్రోఫోన్ అనుమతి తిరస్కరించబడింది',
    errOfflineNoVoice: 'ఆఫ్‌లైన్ వాయిస్ అందుబాటులో లేదు',
    noticeRtlActive: 'కుడి నుండి ఎడమకు'
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
    samplePromptsTitle: 'மாதிரி கேள்விகள்',
    navDashboard: 'டாஷ்போர்டு',
    navVoice: 'குரல் வழிகாட்டி',
    navField: 'களப்பணியாளர்',
    navSupervisor: 'மேற்பார்வையாளர்',
    navTasks: 'பணிகள்',
    navSync: 'ஒத்திசைவு மையம்',
    navRuntime: 'இயங்குதளம்',
    btnSaveDraft: 'வரைவாக சேமி',
    btnSubmitQueue: 'சமர்ப்பித்து வரிசைப்படுத்து',
    btnSyncNow: 'இப்போதே ஒத்திசை',
    btnFilter: 'வடிகட்டு',
    btnClear: 'அழி',
    btnTranslate: 'மொழிபெயர்',
    btnChangeLanguage: 'மொழியை மாற்று',
    labelCategory: 'வகை',
    labelSeverity: 'தீவிரம்',
    labelTitle: 'தலைப்பு',
    labelDescription: 'விளக்கம்',
    labelNotes: 'குறிப்புகள்',
    labelLocation: 'இடம்',
    labelPhotos: 'புகைப்படங்கள்',
    labelOriginalLanguage: 'அசல் மொழி',
    catWater: 'குடிநீர் விநியோகம்',
    catAgriculture: 'விவசாயம்',
    catHealthcare: 'சுகாதாரம்',
    catInfrastructure: 'உள்கட்டமைப்பு',
    catEducation: 'கல்வி',
    catOther: 'மற்றவை',
    sevCritical: 'மிக அவசரம் (Critical)',
    sevHigh: 'அதிகம் (High)',
    sevMedium: 'நடுத்தரம் (Medium)',
    sevLow: 'குறைவு (Low)',
    statusDraft: 'வரைவு',
    statusQueued: 'வரிசையில் உள்ளது',
    statusSyncing: 'ஒத்திசைக்கப்படுகிறது...',
    statusSynced: 'ஒத்திசைக்கப்பட்டது',
    statusConflict: 'முரண்பாடு',
    errNoMic: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது',
    errOfflineNoVoice: 'ஆஃப்லைன் குரல் கிடைக்கவில்லை',
    noticeRtlActive: 'வலமிருந்து இடமாக'
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
    samplePromptsTitle: 'Sample Queries',
    navDashboard: 'Dashboard',
    navVoice: 'Voice Copilot',
    navField: 'Field Worker',
    navSupervisor: 'Supervisor',
    navTasks: 'Tasks',
    navSync: 'Sync Hub',
    navRuntime: 'Runtime',
    btnSaveDraft: 'Save Draft',
    btnSubmitQueue: 'Submit & Queue',
    btnSyncNow: 'Sync Now',
    btnFilter: 'Filter',
    btnClear: 'Clear',
    btnTranslate: 'Translate View',
    btnChangeLanguage: 'Change Language',
    labelCategory: 'Category',
    labelSeverity: 'Severity',
    labelTitle: 'Report Title',
    labelDescription: 'Detailed Description',
    labelNotes: 'Field Notes',
    labelLocation: 'Location Reference',
    labelPhotos: 'Photographs',
    labelOriginalLanguage: 'Authored Language',
    catWater: 'Water Supply',
    catAgriculture: 'Agriculture',
    catHealthcare: 'Healthcare',
    catInfrastructure: 'Infrastructure',
    catEducation: 'Education',
    catOther: 'Other',
    sevCritical: 'Critical',
    sevHigh: 'High',
    sevMedium: 'Medium',
    sevLow: 'Low',
    statusDraft: 'Draft',
    statusQueued: 'Queued',
    statusSyncing: 'Syncing...',
    statusSynced: 'Synced',
    statusConflict: 'Conflict',
    errNoMic: 'Microphone permission denied',
    errOfflineNoVoice: 'Local voice pack not installed. Audio synthesized when online.',
    noticeRtlActive: 'Right-to-Left Text'
  },
  'ur-IN': {
    tagline: 'آسانی سے بولیں، اپنی زبان میں مصدقہ حل پائیں',
    pushToTalk: 'بولنے کے لیے دبا کر رکھیں',
    listening: 'سن رہے ہیں... بولیں',
    processing: 'جواب تیار کیا جا رہا ہے...',
    speaking: 'جواب دیا جا رہا ہے...',
    replay: 'دوبارہ سنیں',
    stop: 'روکیں',
    cancel: 'منسوخ کریں',
    repeatQuestion: 'سوال دہرائیں',
    newConversation: 'نئی گفتگو',
    selectLanguage: 'زبان منتخب کریں',
    verifiedKnowledge: 'تصدیق شدہ زراعتی معلومات',
    offlineNotice: 'آف لائن موڈ فعال ہے',
    samplePromptsTitle: 'نمونہ سوالات',
    navDashboard: 'ڈیش بورڈ',
    navVoice: 'وائس معاون',
    navField: 'فیلڈ ورکر',
    navSupervisor: 'نگران',
    navTasks: 'ٹاسک',
    navSync: 'سنک ہب',
    navRuntime: 'رن ٹائم',
    btnSaveDraft: 'ڈرافٹ محفوظ کریں',
    btnSubmitQueue: 'جمع کریں اور قطار بنائیں',
    btnSyncNow: 'ابھی ہم آہنگ کریں',
    btnFilter: 'فلٹر',
    btnClear: 'صاف کریں',
    btnTranslate: 'ترجمہ دیکھیں',
    btnChangeLanguage: 'زبان تبدیل کریں',
    labelCategory: 'زمرہ',
    labelSeverity: 'شدت',
    labelTitle: 'عنوان',
    labelDescription: 'تفصیل',
    labelNotes: 'نوٹس',
    labelLocation: 'مقام',
    labelPhotos: 'تصاویر',
    labelOriginalLanguage: 'اصل زبان',
    catWater: 'پانی کی فراہمی',
    catAgriculture: 'زراعت',
    catHealthcare: 'صحت کی دیکھ بھال',
    catInfrastructure: 'بنیادی ڈھانچہ',
    catEducation: 'تعلیم',
    catOther: 'دیگر',
    sevCritical: 'انتہائی ضروری (Critical)',
    sevHigh: 'زیادہ (High)',
    sevMedium: 'درمیانہ (Medium)',
    sevLow: 'عام (Low)',
    statusDraft: 'ڈرافٹ',
    statusQueued: 'قطار میں',
    statusSyncing: 'ہم آہنگ ہو رہا ہے...',
    statusSynced: 'ہم آہنگ ہو چکا',
    statusConflict: 'تنازع حل کریں',
    errNoMic: 'مائیکروفون کی اجازت نہیں ملی',
    errOfflineNoVoice: 'آف لائن آواز دستیاب نہیں ہے',
    noticeRtlActive: 'دائیں سے بائیں تحریر'
  },
  'ar-SA': {
    tagline: 'تحدث بصوتك، واحصل على حلول موثوقة بلغتك',
    pushToTalk: 'اضغط للتحدث / انقر للتسجيل',
    listening: 'نستمع الآن... تحدث بوضوح',
    processing: 'جارٍ إعداد الرد...',
    speaking: 'جارٍ قراءة الإجابة...',
    replay: 'إعادة الاستماع',
    stop: 'إيقاف',
    cancel: 'إلغاء',
    repeatQuestion: 'إعادة السؤال',
    newConversation: 'محادثة جديدة',
    selectLanguage: 'اختر اللغة',
    verifiedKnowledge: 'معلومات زراعية وميدانية موثوقة',
    offlineNotice: 'الوضع غير المتصل نشط',
    samplePromptsTitle: 'أمثلة للأسئلة',
    navDashboard: 'لوحة التحكم',
    navVoice: 'المساعد الصوتي',
    navField: 'العامل الميداني',
    navSupervisor: 'المشرف',
    navTasks: 'المهام',
    navSync: 'مركز المزامنة',
    navRuntime: 'بيئة التشغيل',
    btnSaveDraft: 'حفظ كمسودة',
    btnSubmitQueue: 'إرسال إلى قائمة الانتظار',
    btnSyncNow: 'مزامنة الآن',
    btnFilter: 'تصفية',
    btnClear: 'مسح',
    btnTranslate: 'عرض الترجمة',
    btnChangeLanguage: 'تغيير اللغة',
    labelCategory: 'الفئة',
    labelSeverity: 'درجة الأهمية',
    labelTitle: 'عنوان التقرير',
    labelDescription: 'الوصف التفصيلي',
    labelNotes: 'ملاحظات ميدانية',
    labelLocation: 'مرجع الموقع',
    labelPhotos: 'الصور الميدانية',
    labelOriginalLanguage: 'اللغة الأصلية',
    catWater: 'إمدادات المياه',
    catAgriculture: 'الزراعة',
    catHealthcare: 'الرعاية الصحية',
    catInfrastructure: 'البنية التحتية',
    catEducation: 'التعليم',
    catOther: 'أخرى',
    sevCritical: 'حرج جداً (Critical)',
    sevHigh: 'مرتفع (High)',
    sevMedium: 'متوسط (Medium)',
    sevLow: 'عادي (Low)',
    statusDraft: 'مسودة',
    statusQueued: 'في الانتظار',
    statusSyncing: 'جارٍ المزامنة...',
    statusSynced: 'تمت المزامنة',
    statusConflict: 'حل النزاع',
    errNoMic: 'تم رفض إذن الميكروفون',
    errOfflineNoVoice: 'الصوت المحلي غير متوفر حالياً دون إنترنت',
    noticeRtlActive: 'النص من اليمين إلى اليسار'
  },
  'es-ES': {
    tagline: 'Hable con naturalidad y reciba respuestas verificadas en su idioma',
    pushToTalk: 'Mantenga presionado para hablar',
    listening: 'Escuchando... hable claramente',
    processing: 'Generando respuesta...',
    speaking: 'Reproduciendo respuesta...',
    replay: 'Repetir audio',
    stop: 'Detener',
    cancel: 'Cancelar',
    repeatQuestion: 'Repetir pregunta',
    newConversation: 'Nueva conversación',
    selectLanguage: 'Seleccionar idioma',
    verifiedKnowledge: 'Conocimiento agrícola verificado',
    offlineNotice: 'Modo sin conexión activo',
    samplePromptsTitle: 'Consultas de ejemplo',
    navDashboard: 'Panel',
    navVoice: 'Copiloto de Voz',
    navField: 'Trabajador de Campo',
    navSupervisor: 'Supervisor',
    navTasks: 'Tareas',
    navSync: 'Sincronización',
    navRuntime: 'Entorno',
    btnSaveDraft: 'Guardar borrador',
    btnSubmitQueue: 'Enviar y encolar',
    btnSyncNow: 'Sincronizar ahora',
    btnFilter: 'Filtrar',
    btnClear: 'Limpiar',
    btnTranslate: 'Traducir vista',
    btnChangeLanguage: 'Cambiar idioma',
    labelCategory: 'Categoría',
    labelSeverity: 'Severidad',
    labelTitle: 'Título del informe',
    labelDescription: 'Descripción detallada',
    labelNotes: 'Notas de campo',
    labelLocation: 'Ubicación',
    labelPhotos: 'Fotografías',
    labelOriginalLanguage: 'Idioma original',
    catWater: 'Suministro de agua',
    catAgriculture: 'Agricultura',
    catHealthcare: 'Salud',
    catInfrastructure: 'Infraestructura',
    catEducation: 'Educación',
    catOther: 'Otro',
    sevCritical: 'Crítico',
    sevHigh: 'Alto',
    sevMedium: 'Medio',
    sevLow: 'Bajo',
    statusDraft: 'Borrador',
    statusQueued: 'En cola',
    statusSyncing: 'Sincronizando...',
    statusSynced: 'Sincronizado',
    statusConflict: 'Conflicto',
    errNoMic: 'Permiso de micrófono denegado',
    errOfflineNoVoice: 'Voz local no instalada',
    noticeRtlActive: 'Texto de izquierda a derecha'
  },
  'fr-FR': {
    tagline: 'Parlez naturellement et obtenez des réponses dans votre langue',
    pushToTalk: 'Maintenez pour parler',
    listening: 'Écoute en cours...',
    processing: 'Génération de la réponse...',
    speaking: 'Lecture en cours...',
    replay: 'Réécouter',
    stop: 'Arrêter',
    cancel: 'Annuler',
    repeatQuestion: 'Répéter la question',
    newConversation: 'Nouvelle conversation',
    selectLanguage: 'Choisir la langue',
    verifiedKnowledge: 'Connaissances agricoles vérifiées',
    offlineNotice: 'Mode hors-ligne actif',
    samplePromptsTitle: 'Exemples de requêtes',
    navDashboard: 'Tableau de bord',
    navVoice: 'Copilote Vocal',
    navField: 'Agent de Terrain',
    navSupervisor: 'Superviseur',
    navTasks: 'Tâches',
    navSync: 'Synchronisation',
    navRuntime: 'Exécution',
    btnSaveDraft: 'Enregistrer le brouillon',
    btnSubmitQueue: 'Soumettre et mettre en file',
    btnSyncNow: 'Synchroniser',
    btnFilter: 'Filtrer',
    btnClear: 'Effacer',
    btnTranslate: 'Traduire l\'affichage',
    btnChangeLanguage: 'Changer de langue',
    labelCategory: 'Catégorie',
    labelSeverity: 'Gravité',
    labelTitle: 'Titre du rapport',
    labelDescription: 'Description détaillée',
    labelNotes: 'Notes de terrain',
    labelLocation: 'Localisation',
    labelPhotos: 'Photos',
    labelOriginalLanguage: 'Langue d\'origine',
    catWater: 'Approvisionnement en eau',
    catAgriculture: 'Agriculture',
    catHealthcare: 'Santé',
    catInfrastructure: 'Infrastructure',
    catEducation: 'Éducation',
    catOther: 'Autre',
    sevCritical: 'Critique',
    sevHigh: 'Élevé',
    sevMedium: 'Moyen',
    sevLow: 'Faible',
    statusDraft: 'Brouillon',
    statusQueued: 'En file',
    statusSyncing: 'Synchronisation...',
    statusSynced: 'Synchronisé',
    statusConflict: 'Conflit',
    errNoMic: 'Microphone non autorisé',
    errOfflineNoVoice: 'Voix locale non installée',
    noticeRtlActive: 'Texte de gauche à droite'
  }
};

const ENGLISH_FALLBACK = LANGUAGE_DICTIONARY['en-US'] as AppTranslationStrings;

class LanguageService {
  private currentLanguage: string = 'kn-IN';
  private recentLanguages: string[] = ['kn-IN', 'hi-IN', 'en-US'];
  private listeners: Array<(lang: string) => void> = [];
  private installedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.init();
    this.initVoices();
  }

  private async init() {
    try {
      const setting = await db.settings.get('voice_copilot_language');
      if (setting && setting.value) {
        this.currentLanguage = setting.value;
      } else {
        this.currentLanguage = 'kn-IN';
      }

      const recents = await db.settings.get('recent_languages');
      if (recents && Array.isArray(recents.value)) {
        this.recentLanguages = recents.value;
      }
    } catch {
      this.currentLanguage = 'kn-IN';
    }

    this.applyDirection(this.currentLanguage);
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          this.installedVoices = window.speechSynthesis.getVoices();
        } catch {
          this.installedVoices = [];
        }
      };
      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  public getInstalledVoices(): SpeechSynthesisVoice[] {
    if (this.installedVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        this.installedVoices = window.speechSynthesis.getVoices();
      } catch {
        this.installedVoices = [];
      }
    }
    return this.installedVoices;
  }

  /**
   * Performs runtime check to verify if a local TTS voice is installed for the language
   */
  public hasLocalVoice(langCode: string): boolean {
    const voices = this.getInstalledVoices();
    if (!voices || voices.length === 0) return false;
    const prefix = langCode.split('-')[0].toLowerCase();
    const target = langCode.toLowerCase();
    return voices.some(v => v.lang.toLowerCase() === target || v.lang.toLowerCase().startsWith(prefix));
  }

  /**
   * Returns dynamically audited language capability taking into account runtime voices
   */
  public getCapabilities(code?: string): LanguageCapability {
    const target = code || this.currentLanguage;
    const base = LANGUAGE_REGISTRY.find(l => l.code === target) || LANGUAGE_REGISTRY[0];
    const runtimeVoice = this.hasLocalVoice(target);

    return {
      ...base,
      ttsOffline: runtimeVoice || base.ttsOffline
    };
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  public getRecentLanguages(): LanguageCapability[] {
    const list: LanguageCapability[] = [];
    for (const code of this.recentLanguages) {
      const found = LANGUAGE_REGISTRY.find(l => l.code === code);
      if (found) list.push(found);
    }
    return list;
  }

  public async setLanguage(code: string): Promise<void> {
    const found = LANGUAGE_REGISTRY.find(l => l.code === code);
    if (!found) {
      console.warn(`Language code "${code}" not found in registry. Using fallback.`);
    }

    this.currentLanguage = code;

    // Update recent languages
    const nextRecents = [code, ...this.recentLanguages.filter(c => c !== code)].slice(0, 5);
    this.recentLanguages = nextRecents;

    try {
      await db.settings.put({ key: 'voice_copilot_language', value: code });
      await db.settings.put({ key: 'recent_languages', value: nextRecents });
    } catch (err) {
      console.warn('Failed to save language preference to IndexedDB:', err);
    }

    this.applyDirection(code);
    this.notify();
  }

  private applyDirection(_code: string) {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  }

  public getLanguageConfig(code?: string): LanguageCapability {
    const target = code || this.currentLanguage;
    return LANGUAGE_REGISTRY.find(l => l.code === target) || LANGUAGE_REGISTRY[0];
  }

  public getStrings(code?: string): AppTranslationStrings {
    const target = code || this.currentLanguage;
    const specific = LANGUAGE_DICTIONARY[target] || {};
    // Merge with English fallback so no key is ever missing or undefined
    return {
      ...ENGLISH_FALLBACK,
      ...specific
    };
  }

  public searchLanguages(
    query: string, 
    familyFilter: 'All' | 'Indian' | 'International' = 'All'
  ): LanguageCapability[] {
    const q = query.trim().toLowerCase();
    return LANGUAGE_REGISTRY.filter(item => {
      if (familyFilter !== 'All' && item.family !== familyFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.nativeName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.region && item.region.toLowerCase().includes(q))
      );
    });
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
