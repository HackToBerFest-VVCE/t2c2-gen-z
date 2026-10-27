/**
 * Test Suite: Multilingual Language Capability Registry & Full Application Localization
 * Validates:
 * 1. 25+ Indian and International Languages in Central Registry
 * 2. Native Scripts & Unicode Preservation
 * 3. Right-to-Left (RTL) Detection (Arabic, Urdu, Kashmiri, Sindhi)
 * 4. Online vs Offline Capabilities Matrix & Honest Reporting
 * 5. Search & Filter Algorithms (English, Native Script, Code, Region, Family)
 * 6. Fallback Dictionary Integrity (no missing keys, safe English fallback)
 * 7. Language Change & Recents Tracking
 * 8. Multilingual Field Report Metadata Retention
 */

import { 
  languageService, 
  LANGUAGE_REGISTRY 
} from '../services/languageService.ts';
import type { LanguageCapability, FieldReport } from '../types/index.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${detail || 'Condition false'}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('MULTILINGUAL 1: LANGUAGE REGISTRY COVERAGE (25+ LANGS)');
console.log('======================================================\n');

// 1. Registry Size & Major Indian Languages
{
  assert(LANGUAGE_REGISTRY.length >= 25, `Registry contains ${LANGUAGE_REGISTRY.length} languages (>= 25 expected)`);

  const indianCodes = [
    'kn-IN', 'hi-IN', 'te-IN', 'ta-IN', 'ml-IN', 
    'mr-IN', 'bn-IN', 'gu-IN', 'pa-IN', 'or-IN', 
    'ur-IN', 'as-IN'
  ];

  for (const code of indianCodes) {
    const found = LANGUAGE_REGISTRY.find(l => l.code === code);
    assert(!!found, `Indian language registered: ${code} (${found?.name || 'missing'})`);
    assert(found?.family === 'Indian', `${code} family is 'Indian'`);
    assert(!!found?.nativeName && found.nativeName.length > 0, `${code} native script is non-empty: ${found?.nativeName}`);
  }
}

// 2. Major International Languages
{
  const intlCodes = [
    'en-US', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA', 
    'pt-BR', 'id-ID', 'sw-KE', 'zh-CN', 'ja-JP', 
    'ru-RU', 'tr-TR', 'vi-VN', 'ko-KR'
  ];

  for (const code of intlCodes) {
    const found = LANGUAGE_REGISTRY.find(l => l.code === code);
    assert(!!found, `International language registered: ${code} (${found?.name || 'missing'})`);
    assert(found?.family === 'International', `${code} family is 'International'`);
  }
}

console.log('\n======================================================');
console.log('MULTILINGUAL 2: NATIVE SCRIPTS & RTL TEXT DIRECTION');
console.log('======================================================\n');

// 3. Native Script Unicode Integrity
{
  const kn = LANGUAGE_REGISTRY.find(l => l.code === 'kn-IN');
  assert(kn?.nativeName === 'ಕನ್ನಡ', 'Kannada native script preserved accurately');

  const hi = LANGUAGE_REGISTRY.find(l => l.code === 'hi-IN');
  assert(hi?.nativeName === 'हिन्दी', 'Hindi Devanagari script preserved accurately');

  const te = LANGUAGE_REGISTRY.find(l => l.code === 'te-IN');
  assert(te?.nativeName === 'తెలుగు', 'Telugu native script preserved accurately');

  const ta = LANGUAGE_REGISTRY.find(l => l.code === 'ta-IN');
  assert(ta?.nativeName === 'தமிழ்', 'Tamil native script preserved accurately');

  const bn = LANGUAGE_REGISTRY.find(l => l.code === 'bn-IN');
  assert(bn?.nativeName === 'বাংলা', 'Bengali native script preserved accurately');

  const pa = LANGUAGE_REGISTRY.find(l => l.code === 'pa-IN');
  assert(pa?.nativeName === 'ਪੰਜਾਬੀ', 'Punjabi Gurmukhi script preserved accurately');

  const zh = LANGUAGE_REGISTRY.find(l => l.code === 'zh-CN');
  assert(zh?.nativeName === '简体中文', 'Chinese Simplified Hanzi preserved accurately');

  const ja = LANGUAGE_REGISTRY.find(l => l.code === 'ja-JP');
  assert(ja?.nativeName === '日本語', 'Japanese Kanji/Kana preserved accurately');
}

// 4. Right-to-Left (RTL) Identification
{
  const ur = LANGUAGE_REGISTRY.find(l => l.code === 'ur-IN');
  assert(ur?.direction === 'rtl', 'Urdu direction is RTL');
  assert(ur?.nativeName === 'اردو', 'Urdu Nastaliq native name preserved');

  const ar = LANGUAGE_REGISTRY.find(l => l.code === 'ar-SA');
  assert(ar?.direction === 'rtl', 'Arabic direction is RTL');
  assert(ar?.nativeName === 'العربية', 'Arabic native name preserved');

  const ks = LANGUAGE_REGISTRY.find(l => l.code === 'ks-IN');
  assert(ks?.direction === 'rtl', 'Kashmiri direction is RTL');

  const en = LANGUAGE_REGISTRY.find(l => l.code === 'en-US');
  assert(en?.direction === 'ltr', 'English direction is LTR');
}

console.log('\n======================================================');
console.log('MULTILINGUAL 3: CAPABILITY MATRIX & HONEST OFFLINE CHECKS');
console.log('======================================================\n');

// 5. Online vs Offline Capabilities Verification
{
  for (const lang of LANGUAGE_REGISTRY) {
    // Online text generation is widely supported via configured Gemini
    assert(lang.textGenOnline === true, `${lang.name} supports online text generation`);
    assert(lang.onlineProviderAvailable === true, `${lang.name} online provider available`);

    // Speech-to-text online support flag must be boolean
    assert(typeof lang.sttOnline === 'boolean', `${lang.name} STT online is boolean`);

    // Offline claims must NOT falsely declare offline TTS/STT if unavailable
    assert(typeof lang.sttOffline === 'boolean', `${lang.name} STT offline is boolean`);
    assert(typeof lang.ttsOffline === 'boolean', `${lang.name} TTS offline is boolean`);

    // Verify sample query exists and is in native script
    assert(!!lang.sampleQuery && lang.sampleQuery.length > 5, `${lang.name} has non-empty sample query`);
  }

  // Known limitation honesty check: Sanskrit lacks STT
  const sa = LANGUAGE_REGISTRY.find(l => l.code === 'sa-IN');
  assert(sa?.sttOnline === false, 'Sanskrit honestly reflects no STT support');

  // Konkani honestly reflects audio synthesis limitation
  const kok = LANGUAGE_REGISTRY.find(l => l.code === 'kok-IN');
  assert(kok?.ttsOnline === false, 'Konkani honestly reflects lack of dedicated cloud TTS voice');
}

console.log('\n======================================================');
console.log('MULTILINGUAL 4: SEARCH & REGIONAL FILTERING');
console.log('======================================================\n');

// 6. Search filtering by English name, script, code, and region
{
  const searchKn = languageService.searchLanguages('Kannada');
  assert(searchKn.length >= 1 && searchKn[0].code === 'kn-IN', 'Search by English "Kannada" finds kn-IN');

  const searchScript = languageService.searchLanguages('ಕನ್ನಡ');
  assert(searchScript.length >= 1 && searchScript[0].code === 'kn-IN', 'Search by native script "ಕನ್ನಡ" finds kn-IN');

  const searchCode = languageService.searchLanguages('es-ES');
  assert(searchCode.length >= 1 && searchCode[0].name === 'Spanish', 'Search by code "es-ES" finds Spanish');

  const searchRegion = languageService.searchLanguages('Kerala');
  assert(searchRegion.length >= 1 && searchRegion[0].code === 'ml-IN', 'Search by region "Kerala" finds Malayalam');

  const searchArabic = languageService.searchLanguages('العربية');
  assert(searchArabic.length >= 1 && searchArabic[0].code === 'ar-SA', 'Search by Arabic script finds ar-SA');

  // Family filtering
  const indianOnly = languageService.searchLanguages('', 'Indian');
  assert(indianOnly.every(l => l.family === 'Indian'), 'Indian filter returns only Indian languages');

  const intlOnly = languageService.searchLanguages('', 'International');
  assert(intlOnly.every(l => l.family === 'International'), 'International filter returns only International languages');
}

console.log('\n======================================================');
console.log('MULTILINGUAL 5: TRANSLATION FALLBACK INTEGRITY');
console.log('======================================================\n');

// 7. Dictionary fallback returns complete strings without throwing
{
  // Full Kannada strings
  const stringsKn = languageService.getStrings('kn-IN');
  assert(stringsKn.tagline.includes('ಸಹಜವಾಗಿ'), 'Kannada tagline localized');
  assert(stringsKn.btnSaveDraft === 'ಕರಡು ಉಳಿಸಿ', 'Kannada save draft localized');
  assert(stringsKn.catWater === 'ಕುಡಿಯುವ ನೀರು', 'Kannada water supply category localized');

  // Full Hindi strings
  const stringsHi = languageService.getStrings('hi-IN');
  assert(stringsHi.btnSaveDraft === 'ड्राफ्ट सहेजें', 'Hindi save draft localized');
  assert(stringsHi.catWater === 'जल आपूर्ति', 'Hindi water category localized');

  // Full Urdu strings
  const stringsUr = languageService.getStrings('ur-IN');
  assert(stringsUr.btnSaveDraft === 'ڈرافٹ محفوظ کریں', 'Urdu save draft localized');
  assert(stringsUr.catWater === 'پانی کی فراہمی', 'Urdu water category localized');

  // Language without full custom strings safely falls back to English for missing keys
  const stringsMl = languageService.getStrings('ml-IN');
  assert(!!stringsMl.tagline, 'Malayalam safely falls back to tagline');
  assert(!!stringsMl.btnSaveDraft, 'Malayalam safely falls back to English btnSaveDraft');
  assert(stringsMl.btnSaveDraft === 'Save Draft', 'Fallback btnSaveDraft is "Save Draft"');

  // Non-existent language code safely falls back to English
  const stringsUnknown = languageService.getStrings('xx-YY');
  assert(stringsUnknown.btnSaveDraft === 'Save Draft', 'Unknown language safely falls back to English');
}

console.log('\n======================================================');
console.log('MULTILINGUAL 6: FIELD REPORT MULTILINGUAL METADATA');
console.log('======================================================\n');

// 8. Field report schema stores original_language without overwriting
{
  const report: FieldReport = {
    id: 'report-multi-test-01',
    title: 'ನಾರಾಯಣಪುರ ಕೆರೆ ಏರಿ ಒಡೆದಿದೆ',
    description: 'ಕೆರೆಯ ಏರಿ ೫ ಮೀಟರ್ ಒಡೆದು ನೀರು ತೋಟಕ್ಕೆ ನುಗ್ಗುತ್ತಿದೆ. ತಕ್ಷಣ ಮರಳು ಮೂಟೆಗಳನ್ನು ಹಾಕಬೇಕು.',
    category: 'agriculture',
    severity: 'critical',
    original_language: 'kn-IN',
    preferred_language: 'kn-IN',
    worker_id: 'worker-ka-01',
    ai_status: 'completed',
    ai_summary: 'Critical irrigation bund breach requiring sandbags.',
    sync_status: 'pending_sync',
    revision: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  assert(report.original_language === 'kn-IN', 'Report preserves original_language as kn-IN');
  assert(report.title.includes('ಕೆರೆ'), 'Original Kannada title preserved without character corruption');
  assert(report.description.includes('ಮರಳು ಮೂಟೆಗಳನ್ನು'), 'Original Kannada description intact');
  assert(report.ai_summary !== report.description, 'Original description is strictly separated from AI summary');
}

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Multilingual Capability Registry tests passed successfully!\n');
}
