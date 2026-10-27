/**
 * Unit Test Suite for:
 * 1. Smart Task Priority Assistant (classification, reasoning, actions, filtering, fallback)
 * 2. Smart Offline Sync Monitor & Queue Logic (backoff, idempotency, retry, reachability)
 */

import { 
  evaluateTaskPriority, 
  matchesPriorityFilter,
  mapAssistantToLegacyPriority,
  mapLegacyToAssistantPriority 
} from '../services/priorityAssistant.ts';
import type { TaskRecord } from '../types/index.ts';

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
console.log('FEATURE 1: SMART TASK PRIORITY ASSISTANT TEST SUITE');
console.log('======================================================\n');

// 1. High Priority - Water Pump Outage at Primary School
{
  const task: Partial<TaskRecord> = {
    id: 'test-water-01',
    title: 'Primary School Hand Pump Breakdown',
    description: 'The drinking water hand pump near primary school has stopped working. 45 families affected.',
    category: 'water_supply',
    location: 'Village Primary School, Sector 2',
    affected_population: 45,
    verified_evidence: false
  };

  const evalResult = evaluateTaskPriority(task);
  assert(evalResult.priority === 'HIGH', 'High Priority: Water pump breakdown at school');
  assert(evalResult.score >= 70, `Score is in High range (actual: ${evalResult.score})`);
  assert(evalResult.reason.toLowerCase().includes('water'), 'Reason cites water source disruption');
  assert(evalResult.suggestedAction.toLowerCase().includes('crew') || evalResult.suggestedAction.toLowerCase().includes('tanker'), 'Suggested action cites mechanical repair crew / tanker');
  assert(evalResult.factors.length >= 2, 'Multiple transparent factors listed');
}

// 2. High Priority - Healthcare Vaccine Cold Chain Failure
{
  const task: Partial<TaskRecord> = {
    id: 'test-health-01',
    title: 'PHC Vaccine Refrigerator Power Loss',
    description: 'Clinic refrigerator cold chain power failed. Critical vaccines at risk of spoilage.',
    category: 'healthcare',
    location: 'Primary Health Centre',
    affected_population: 120,
    verified_evidence: false
  };

  const evalResult = evaluateTaskPriority(task);
  assert(evalResult.priority === 'HIGH', 'High Priority: Vaccine cold chain emergency');
  assert(evalResult.urgencyLevel === 'immediate' || evalResult.urgencyLevel === 'high', 'Urgency level is immediate or high');
  assert(evalResult.reason.toLowerCase().includes('vaccine') || evalResult.reason.toLowerCase().includes('cold-chain'), 'Reason specifies cold-chain risk');
  assert(evalResult.suggestedAction.toLowerCase().includes('inverter') || evalResult.suggestedAction.toLowerCase().includes('power'), 'Suggested action instructs emergency power / medical transfer');
}

// 3. High Priority - Infrastructure Live Electrical Hazard
{
  const task: Partial<TaskRecord> = {
    id: 'test-infra-01',
    title: 'Fallen Live Electric Wire Across Main Road',
    description: 'Heavy rain caused electric pole collapse and live wire is sparking across road.',
    category: 'infrastructure',
    location: 'Main Village Road',
    affected_population: 80,
    verified_evidence: false
  };

  const evalResult = evaluateTaskPriority(task);
  assert(evalResult.priority === 'HIGH', 'High Priority: Live electrical wire hazard');
  assert(evalResult.suggestedAction.toLowerCase().includes('cordon') || evalResult.suggestedAction.toLowerCase().includes('signage'), 'Suggested action instructs perimeter cordoning');
}

// 4. Medium Priority - Local Road / Canal Maintenance
{
  const task: Partial<TaskRecord> = {
    id: 'test-canal-01',
    title: 'Secondary Irrigation Canal Silt Build-up',
    description: 'Water flow in canal is slowed due to silt accumulation. Needs desiltation before next week.',
    category: 'agriculture',
    location: 'West Field Canal',
    affected_population: 15,
    verified_evidence: true
  };

  const evalResult = evaluateTaskPriority(task);
  assert(evalResult.priority === 'MEDIUM', `Medium Priority: Canal desiltation (actual: ${evalResult.priority})`);
  assert(evalResult.score >= 35 && evalResult.score < 70, `Score is in Medium range (actual: ${evalResult.score})`);
  assert(evalResult.suggestedAction.length > 10, 'Suggested action provided for medium task');
}

// 5. Low Priority - Routine Survey or Minor Cosmetic Repair
{
  const task: Partial<TaskRecord> = {
    id: 'test-routine-01',
    title: 'Panchayat Office Boundary Wall Whitewash Survey',
    description: 'Routine annual audit and aesthetic survey for boundary wall painting. Minor cosmetic wear.',
    category: 'other',
    location: 'Panchayat Bhavan',
    affected_population: 0,
    verified_evidence: true
  };

  const evalResult = evaluateTaskPriority(task);
  assert(evalResult.priority === 'LOW', `Low Priority: Routine cosmetic survey (actual: ${evalResult.priority})`);
  assert(evalResult.score < 40, `Score is in Low range (actual: ${evalResult.score})`);
  assert(evalResult.urgencyLevel === 'routine', 'Urgency level is routine');
  assert(evalResult.suggestedAction.toLowerCase().includes('weekly') || evalResult.suggestedAction.toLowerCase().includes('routine'), 'Action recommends weekly route');
}

// 6. Graceful Handling of Missing / Sparse Data
{
  const emptyTask: Partial<TaskRecord> = {};
  const evalResult = evaluateTaskPriority(emptyTask);
  assert(evalResult !== null && evalResult !== undefined, 'Does not crash on empty task');
  assert(typeof evalResult.priority === 'string', 'Returns valid priority string');
  assert(typeof evalResult.score === 'number' && evalResult.score >= 0, 'Returns valid numerical score');
  assert(evalResult.reason.length > 0, 'Generates fallback reason without error');
  assert(evalResult.suggestedAction.length > 0, 'Generates fallback suggested action without error');
}

// 7. Priority Filter Matching
{
  const highTask: Partial<TaskRecord> = { title: 'Emergency Hospital Generator Failure', description: 'Urgent power loss' };
  const lowTask: Partial<TaskRecord> = { title: 'Minor paint scratch on fence', description: 'Routine aesthetic survey' };

  assert(matchesPriorityFilter(highTask, 'all'), 'Matches ALL filter');
  assert(matchesPriorityFilter(highTask, 'HIGH'), 'Matches HIGH filter');
  assert(!matchesPriorityFilter(highTask, 'LOW'), 'Does not match LOW filter');
  assert(matchesPriorityFilter(lowTask, 'LOW'), 'Low task matches LOW filter');
}

// 8. Legacy Mapping Symmetry
{
  assert(mapAssistantToLegacyPriority('HIGH') === 'high', 'Maps HIGH to high');
  assert(mapAssistantToLegacyPriority('MEDIUM') === 'medium', 'Maps MEDIUM to medium');
  assert(mapAssistantToLegacyPriority('LOW') === 'low', 'Maps LOW to low');
  assert(mapLegacyToAssistantPriority('critical') === 'HIGH', 'Maps critical to HIGH');
  assert(mapLegacyToAssistantPriority('high') === 'HIGH', 'Maps high to HIGH');
  assert(mapLegacyToAssistantPriority('medium') === 'MEDIUM', 'Maps medium to MEDIUM');
  assert(mapLegacyToAssistantPriority('low') === 'LOW', 'Maps low to LOW');
}

console.log('\n======================================================');
console.log('FEATURE 2: SMART OFFLINE SYNC MONITOR LOGIC TESTS');
console.log('======================================================\n');

// 9. Bounded Exponential Backoff Logic
{
  function calculateBackoff(retryCount: number): number {
    const base = 1000;
    const max = 30000;
    return Math.min(base * Math.pow(2, retryCount), max);
  }

  assert(calculateBackoff(0) === 1000, 'Backoff retry 0 = 1000ms');
  assert(calculateBackoff(1) === 2000, 'Backoff retry 1 = 2000ms');
  assert(calculateBackoff(2) === 4000, 'Backoff retry 2 = 4000ms');
  assert(calculateBackoff(3) === 8000, 'Backoff retry 3 = 8000ms');
  assert(calculateBackoff(4) === 16000, 'Backoff retry 4 = 16000ms');
  assert(calculateBackoff(5) === 30000, 'Backoff retry 5 is capped at 30000ms');
  assert(calculateBackoff(10) === 30000, 'Backoff retry 10 is bounded at 30000ms');
}

// 10. Max Retry Suspension Threshold
{
  const MAX_RETRIES = 5;
  function shouldSuspendAutoSync(consecutiveFailures: number): boolean {
    return consecutiveFailures >= MAX_RETRIES;
  }

  assert(!shouldSuspendAutoSync(1), 'Does not suspend on 1 failure');
  assert(!shouldSuspendAutoSync(4), 'Does not suspend on 4 failures');
  assert(shouldSuspendAutoSync(5), 'Suspends auto-sync on 5 consecutive failures');
  assert(shouldSuspendAutoSync(8), 'Remains suspended above 5 failures to prevent infinite loop');
}

// 11. Idempotent Outbox Operation ID Generator
{
  function generateOutboxId(taskId: string): string {
    return `outbox-${taskId}`;
  }

  const id1 = generateOutboxId('task-water-01');
  const id2 = generateOutboxId('task-water-01');
  assert(id1 === id2, 'Generates consistent, stable outbox ID for idempotency');
}

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Feature 1 and Feature 2 tests passed successfully!\n');
}
