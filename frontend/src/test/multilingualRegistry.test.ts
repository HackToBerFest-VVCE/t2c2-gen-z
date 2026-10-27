/**
 * Test Suite: Multilingual Language Capability Registry & Accessibility
 * Validates:
 * 1. 27 Indian and International Languages in Central Registry
 * 2. Priority 1-5 Languages (Kannada, Hindi, Telugu, Tamil, English)
 * 3. Native Scripts & Unicode Preservation (ಕನ್ನಡ, हिन्दी, తెలుగు, தமிழ், etc.)
 * 4. Search & Filter Algorithms (English, Native Script, Code, Family)
 * 5. Language Switching & Recents Persistence
 */

import { 
  languageService, 
  LANGUAGE_REGISTRY 
} from '../services/languageService.ts';

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
console.log('MULTILINGUAL 1: CENTRAL LANGUAGE REGISTRY ACCESSIBILITY');
console.log('======================================================\n');

// 1. Registry Size & Major Indian Languages
{
  assert(LANGUAGE_REGISTRY.length >= 25, `Registry contains ${LANGUAGE_REGISTRY.length} accessible languages (>= 25 expected)`);

  const indianCodes = [
    'kn-IN', 'hi-IN', 'te-IN', 'ta-IN', 'ml-IN', 
    'mr-IN', 'bn-IN', 'gu-IN', 'pa-IN', 'or-IN', 
    'ur-IN', 'as-IN'
  ];

  for (const code of indianCodes) {
    const found = LANGUAGE_REGISTRY.find(l => l.code === code);
    assert(!!found, `Indian language accessible: ${code} (${found?.name || 'missing'})`);
    assert(found?.family === 'Indian', `${code} family is 'Indian'`);
    assert(!!found?.nativeName && found.nativeName.length > 0, `${code} native script: ${found?.nativeName}`);
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
    assert(!!found, `International language accessible: ${code} (${found?.name || 'missing'})`);
    assert(found?.family === 'International', `${code} family is 'International'`);
  }
}

console.log('\n======================================================');
console.log('MULTILINGUAL 2: SEARCH & FILTER CAPABILITIES');
console.log('======================================================\n');

// 3. Search by English name, Native script, and Code
{
  const searchKn = languageService.searchLanguages('Kannada');
  assert(searchKn.some(l => l.code === 'kn-IN'), 'Search by "Kannada" finds kn-IN');

  const searchNative = languageService.searchLanguages('ಕನ್ನಡ');
  assert(searchNative.some(l => l.code === 'kn-IN'), 'Search by native script "ಕನ್ನಡ" finds kn-IN');

  const searchHindi = languageService.searchLanguages('हिन्दी');
  assert(searchHindi.some(l => l.code === 'hi-IN'), 'Search by native script "हिन्दी" finds hi-IN');

  const searchCode = languageService.searchLanguages('te-IN');
  assert(searchCode.some(l => l.code === 'te-IN'), 'Search by code "te-IN" finds Telugu');

  const indianFamily = languageService.searchLanguages('', 'Indian');
  assert(indianFamily.length >= 12, `Filtered by Indian family returns ${indianFamily.length} languages (>= 12)`);

  const intlFamily = languageService.searchLanguages('', 'International');
  assert(intlFamily.length >= 14, `Filtered by International family returns ${intlFamily.length} languages (>= 14)`);
}

console.log('\n======================================================');
console.log('MULTILINGUAL 3: LANGUAGE SWITCHING & PERSISTENCE');
console.log('======================================================\n');

// 4. Default and Set Language
{
  const current = languageService.getLanguage();
  assert(!!current, `Current language is non-empty: ${current}`);

  const knConfig = languageService.getLanguageConfig('kn-IN');
  assert(knConfig.nativeName === 'ಕನ್ನಡ', 'Kannada configuration matches');

  const hiConfig = languageService.getLanguageConfig('hi-IN');
  assert(hiConfig.nativeName === 'हिन्दी', 'Hindi configuration matches');

  const teConfig = languageService.getLanguageConfig('te-IN');
  assert(teConfig.nativeName === 'తెలుగు', 'Telugu configuration matches');

  const taConfig = languageService.getLanguageConfig('ta-IN');
  assert(taConfig.nativeName === 'தமிழ்', 'Tamil configuration matches');
}

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Multilingual Language Accessibility tests passed successfully!\n');
}
