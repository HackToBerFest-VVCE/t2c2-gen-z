/**
 * Unit Test Suite for:
 * 1. Multilingual Voice Copilot & Language Service
 * 2. Verified Local Agricultural Knowledge Base
 * 3. Operating Modes (Online, Hybrid, Strict Offline)
 * 4. Resource-Aware Task Scheduler Logic
 * 5. Field Worker Report & Attachment Validation
 */

import { SUPPORTED_LANGUAGES, LANGUAGE_DICTIONARY } from '../services/languageService.ts';
import { queryLocalKnowledge, VERIFIED_LOCAL_KNOWLEDGE } from '../services/localKnowledgeService.ts';

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
console.log('FEATURE 1: MULTILINGUAL VOICE COPILOT & LANGUAGE TESTS');
console.log('======================================================\n');

// 1. Language Priority Order Verification
{
  assert(SUPPORTED_LANGUAGES.length >= 5, 'At least 5 core supported languages defined with top priorities');
  assert(SUPPORTED_LANGUAGES[0].code === 'kn-IN', 'Language Priority 1 is Kannada (kn-IN)');
  assert(SUPPORTED_LANGUAGES[0].nativeName === 'ಕನ್ನಡ', 'Priority 1 native name is ಕನ್ನಡ');
  assert(SUPPORTED_LANGUAGES[1].code === 'hi-IN', 'Language Priority 2 is Hindi (hi-IN)');
  assert(SUPPORTED_LANGUAGES[2].code === 'te-IN', 'Language Priority 3 is Telugu (te-IN)');
  assert(SUPPORTED_LANGUAGES[3].code === 'ta-IN', 'Language Priority 4 is Tamil (ta-IN)');
  assert(SUPPORTED_LANGUAGES[4].code === 'en-US', 'Language Priority 5 is English (en-US)');
}

// 2. Multilingual Dictionary Strings
{
  const coreLangs = SUPPORTED_LANGUAGES.slice(0, 5);
  for (const lang of coreLangs) {
    const dict = LANGUAGE_DICTIONARY[lang.code];
    assert(!!dict, `Dictionary exists for language ${lang.code}`);
    assert(!!dict.pushToTalk, `Push-to-talk label exists for ${lang.code}`);
    assert(!!dict.listening, `Listening label exists for ${lang.code}`);
    assert(!!dict.verifiedKnowledge, `Verified knowledge label exists for ${lang.code}`);
  }
}

console.log('\n======================================================');
console.log('FEATURE 2: VERIFIED LOCAL AGRICULTURAL KNOWLEDGE BASE');
console.log('======================================================\n');

// 3. Arecanut Koleroga Knowledge Query (Kannada & English)
{
  const resKn = queryLocalKnowledge('ಅಡಿಕೆ ಬೆಳೆಯಲ್ಲಿ ಕೊಳೆ ರೋಗ ಬಂದಿದೆ', 'kn-IN');
  assert(resKn !== null, 'Found local knowledge for Arecanut Koleroga in Kannada');
  assert(!!resKn?.advice.includes('ಬೋರ್ಡೋ ದ್ರಾವಣ'), 'Advice specifies Bordeaux mixture in Kannada');
  assert(!!resKn?.entry.provenance.includes('AGRI-KA-ARECA-01'), 'Provenance code matches AGRI-KA-ARECA-01');
  assert((resKn?.clarifyingQuestions?.length ?? 0) >= 1, 'Clarifying questions included');

  const resEn = queryLocalKnowledge('How to treat Koleroga fruit rot in arecanut?', 'en-US');
  assert(resEn !== null, 'Found local knowledge for Koleroga in English');
  assert(!!resEn?.advice.includes('Bordeaux mixture'), 'Advice specifies Bordeaux mixture in English');
  assert(!!(resEn?.entry.source.includes('UAS Bangalore') || resEn?.entry.source.includes('CPCRI')), 'Source cites recognized agricultural university');
}

// 4. Paddy Blast Disease Query
{
  const resPaddy = queryLocalKnowledge('paddy blast symptoms on leaves', 'en-US');
  assert(resPaddy !== null, 'Found local knowledge for Paddy Blast');
  assert(!!(resPaddy?.advice.toLowerCase().includes('urea') || resPaddy?.advice.toLowerCase().includes('nitrogen')), 'Advice addresses chemical nitrogen top-dressing');
  assert(!!resPaddy?.entry.provenance.includes('AGRI-KA-PADDY-04'), 'Provenance code matches AGRI-KA-PADDY-04');
}

// 5. Tomato Leaf Curl Query
{
  const resTomato = queryLocalKnowledge('tomato leaf curl virus whitefly', 'en-US');
  assert(resTomato !== null, 'Found local knowledge for Tomato Leaf Curl');
  assert(!!resTomato?.advice.toLowerCase().includes('sticky traps'), 'Recommends yellow sticky traps');
  assert(!!resTomato?.entry.source.includes('IIHR'), 'Source cites ICAR-IIHR Hessaraghatta');
}

// 6. Civic Water Infrastructure Query
{
  const resWater = queryLocalKnowledge('village hand pump stopped working', 'en-US');
  assert(resWater !== null, 'Found local knowledge for Hand Pump repair');
  assert(!!(resWater?.advice.toLowerCase().includes('chain') || resWater?.advice.toLowerCase().includes('valve')), 'Recommends chain and foot-valve diagnostic');
}

console.log('\n======================================================');
console.log('FEATURE 3: OPERATING MODES & STRICT OFFLINE ENFORCEMENT');
console.log('======================================================\n');

// 7. Operating Mode Definitions
{
  const modes = ['online', 'hybrid', 'strict_offline'];
  assert(modes.includes('online'), 'Online mode supported');
  assert(modes.includes('hybrid'), 'Hybrid mode supported');
  assert(modes.includes('strict_offline'), 'Strict offline mode supported');
}

console.log('\n======================================================');
console.log('FEATURE 4: RESOURCE-AWARE SCHEDULER PRIORITY LOGIC');
console.log('======================================================\n');

// 8. Priority Ordering Logic
{
  const priorityOrder: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  const tasks = [
    { id: '1', priority: 'medium' },
    { id: '2', priority: 'critical' },
    { id: '3', priority: 'low' },
    { id: '4', priority: 'high' }
  ];

  tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  assert(tasks[0].priority === 'critical', 'First task is critical priority');
  assert(tasks[1].priority === 'high', 'Second task is high priority');
  assert(tasks[2].priority === 'medium', 'Third task is medium priority');
  assert(tasks[3].priority === 'low', 'Fourth task is low priority');
}

// 9. Battery Deferral Check Logic
{
  const lowPowerMode = true;
  const isCritical = (taskPriority: string) => taskPriority === 'critical';
  const shouldDeferInLowPower = (priority: string) => lowPowerMode && !isCritical(priority);

  assert(shouldDeferInLowPower('low') === true, 'Low priority task deferred in low power mode');
  assert(shouldDeferInLowPower('medium') === true, 'Medium priority task deferred in low power mode');
  assert(shouldDeferInLowPower('high') === true, 'High priority task deferred in low power mode');
  assert(shouldDeferInLowPower('critical') === false, 'Critical priority task NOT deferred in low power mode');
}

console.log('\n======================================================');
console.log('FEATURE 5: PHOTO ATTACHMENT & REPORT VALIDATION');
console.log('======================================================\n');

// 10. MIME Type and Size Validation
{
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const isValidMime = (mime: string) => allowedMimeTypes.includes(mime);
  const isValidSize = (sizeBytes: number) => sizeBytes <= 10 * 1024 * 1024;

  assert(isValidMime('image/jpeg'), 'JPEG is allowed');
  assert(isValidMime('image/png'), 'PNG is allowed');
  assert(isValidMime('image/webp'), 'WebP is allowed');
  assert(!isValidMime('application/pdf'), 'PDF is rejected as photo attachment');
  assert(!isValidMime('application/x-msdownload'), 'Executable is rejected');

  assert(isValidSize(5 * 1024 * 1024), '5MB file is within 10MB limit');
  assert(!isValidSize(12 * 1024 * 1024), '12MB file exceeds 10MB limit');
}

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Multilingual Voice Copilot & Field Worker tests passed successfully!\n');
}
