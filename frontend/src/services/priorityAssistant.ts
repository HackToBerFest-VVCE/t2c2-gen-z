/**
 * FieldPilot Smart Task Priority Assistant
 * 
 * Transparent, deterministic, rule-based priority engine designed for rural field operations.
 * Works 100% offline without any cloud AI API or external network dependencies.
 * Evaluates tasks into HIGH, MEDIUM, and LOW priority with explicit reasoning,
 * urgency scoring (0-100), and practical next operational directives.
 */

import type { TaskRecord, TaskCategory, TaskPriority } from '../types';

export type AssistantPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PriorityEvaluation {
  priority: AssistantPriority;
  score: number; // 0 to 100
  reason: string;
  suggestedAction: string;
  urgencyLevel: 'immediate' | 'high' | 'moderate' | 'routine';
  factors: string[];
  evaluatedAt: string;
}

// Critical infrastructure & public safety triggers
const CRITICAL_KEYWORDS = [
  'urgent', 'emergency', 'danger', 'hazard', 'breakdown', 'stopped working',
  'outage', 'contamination', 'flood', 'collapse', 'collapsed', 'live wire',
  'electric wire', 'fire', 'injury', 'vaccine', 'cold chain', 'hospital',
  'clinic', 'phc', 'potable water', 'drinking water', 'failure', 'burst'
];

const MODERATE_KEYWORDS = [
  'blocked', 'leak', 'leaking', 'repair', 'silt', 'pest', 'damage',
  'cracked', 'malfunction', 'slow', 'blight', 'overdue', 'schedule'
];

const ROUTINE_KEYWORDS = [
  'minor', 'cosmetic', 'routine', 'aesthetic', 'survey', 'audit',
  'upcoming', 'maintenance', 'inspection', 'non-urgent', 'cleaning', 'paint'
];

const SENSITIVE_LOCATIONS = [
  'school', 'primary school', 'hospital', 'clinic', 'phc', 'sub-center',
  'anganwadi', 'drinking water', 'community well', 'main road', 'market'
];

/**
 * Deterministically evaluates task priority using structured civic rules.
 * Handles missing or partial task information without crashing.
 */
export function evaluateTaskPriority(task: Partial<TaskRecord>): PriorityEvaluation {
  const title = (task.title || '').trim();
  const description = (task.description || '').trim();
  const location = (task.location || '').toLowerCase();
  const category = (task.category || 'other') as TaskCategory;
  const affectedPopulation = typeof task.affected_population === 'number' ? task.affected_population : 0;
  const verifiedEvidence = Boolean(task.verified_evidence);
  const status = task.status || 'draft';

  const combinedText = `${title} ${description}`.toLowerCase();
  const factors: string[] = [];
  let score = 20; // Base baseline score for any reported civic incident

  // 1. Critical keyword detection (+25 to +40)
  const matchedCritical = CRITICAL_KEYWORDS.filter(kw => combinedText.includes(kw));
  if (matchedCritical.length > 0) {
    const kwWeight = Math.min(matchedCritical.length * 15, 40);
    score += kwWeight;
    factors.push(`Urgent safety keywords detected: [${matchedCritical.slice(0, 3).join(', ')}] (+${kwWeight})`);
  }

  // 2. Sensitive location context (+15 to +25)
  const isSensitiveLocation = SENSITIVE_LOCATIONS.some(loc => location.includes(loc) || combinedText.includes(loc));
  if (isSensitiveLocation) {
    score += 20;
    factors.push('Located near vulnerable community site (school, clinic, or primary well) (+20)');
  }

  // 3. Domain category weighting
  switch (category) {
    case 'healthcare':
      if (combinedText.includes('vaccine') || combinedText.includes('fridge') || combinedText.includes('cold chain') || combinedText.includes('medicine')) {
        score += 30;
        factors.push('Critical healthcare domain: vaccine cold-chain / medicine storage risk (+30)');
      } else {
        score += 15;
        factors.push('Healthcare facility incident (+15)');
      }
      break;

    case 'water_supply':
      if (combinedText.includes('hand pump') || combinedText.includes('handpump') || combinedText.includes('potable') || combinedText.includes('drinking')) {
        score += 25;
        factors.push('Essential drinking water source disruption (+25)');
      } else {
        score += 15;
        factors.push('Water supply infrastructure incident (+15)');
      }
      break;

    case 'infrastructure':
      if (combinedText.includes('electric') || combinedText.includes('wire') || combinedText.includes('bridge') || combinedText.includes('collapse')) {
        score += 25;
        factors.push('Public transit / electrical safety hazard (+25)');
      } else {
        score += 10;
        factors.push('General infrastructure maintenance (+10)');
      }
      break;

    case 'agriculture':
      if (combinedText.includes('pest') || combinedText.includes('blight') || combinedText.includes('canal') || combinedText.includes('drought')) {
        score += 20;
        factors.push('Livelihood risk: agricultural pest / irrigation canal disruption (+20)');
      } else {
        score += 10;
        factors.push('Agricultural support incident (+10)');
      }
      break;

    case 'education':
      if (combinedText.includes('meal') || combinedText.includes('sanitation') || combinedText.includes('water')) {
        score += 20;
        factors.push('School sanitation / nutrition facility impact (+20)');
      } else {
        score += 10;
        factors.push('Educational facility support (+10)');
      }
      break;

    default:
      break;
  }

  // 4. Affected population weighting
  if (affectedPopulation >= 50) {
    score += 25;
    factors.push(`Large population impact (≥50 individuals / ~${affectedPopulation} pop) (+25)`);
  } else if (affectedPopulation >= 25) {
    score += 18;
    factors.push(`Significant population impact (≥25 individuals / ~${affectedPopulation} pop) (+18)`);
  } else if (affectedPopulation >= 10) {
    score += 10;
    factors.push(`Moderate population impact (≥10 individuals / ~${affectedPopulation} pop) (+10)`);
  }

  // 5. Routine keywords / Minor adjustments (-25)
  const matchedRoutine = ROUTINE_KEYWORDS.filter(kw => combinedText.includes(kw));
  if (matchedRoutine.length > 0 && matchedCritical.length === 0) {
    score = Math.max(score - 25, 10);
    factors.push(`Routine maintenance descriptors present: [${matchedRoutine.slice(0, 2).join(', ')}] (-25)`);
  }

  // 6. Conflict / Verification Status checks
  if (status === 'conflict') {
    score += 10;
    factors.push('Concurrent sync revision conflict: administrative resolution required (+10)');
  }

  if (!verifiedEvidence && score >= 60) {
    factors.push('Safety Guardrail: Physical evidence unverified; on-site inspection mandatory before repair ticket closure');
  }

  // Cap score between 0 and 100
  score = Math.min(Math.max(Math.round(score), 5), 100);

  // Map to Assistant Priority
  let priority: AssistantPriority = 'MEDIUM';
  let urgencyLevel: PriorityEvaluation['urgencyLevel'] = 'moderate';

  if (score >= 70) {
    priority = 'HIGH';
    urgencyLevel = score >= 85 ? 'immediate' : 'high';
  } else if (score < 40) {
    priority = 'LOW';
    urgencyLevel = 'routine';
  } else {
    priority = 'MEDIUM';
    urgencyLevel = 'moderate';
  }

  // Generate transparent reason and actionable recommendation
  const { reason, suggestedAction } = generateReasonAndAction(
    priority,
    category,
    title,
    affectedPopulation,
    isSensitiveLocation,
    verifiedEvidence,
    combinedText
  );

  return {
    priority,
    score,
    reason,
    suggestedAction,
    urgencyLevel,
    factors,
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * Builds clear, context-aware operational justifications and practical directives.
 */
function generateReasonAndAction(
  priority: AssistantPriority,
  category: TaskCategory,
  title: string,
  affectedPopulation: number,
  isSensitiveLocation: boolean,
  verifiedEvidence: boolean,
  text: string
): { reason: string; suggestedAction: string } {
  const popText = affectedPopulation > 0 ? ` impacting ~${affectedPopulation} dependent people` : '';

  if (priority === 'HIGH') {
    if (category === 'water_supply') {
      return {
        reason: `Essential drinking water source disruption${popText}${isSensitiveLocation ? ' at a vulnerable public site' : ''}.`,
        suggestedAction: 'Dispatch mechanical repair crew immediately to inspect cylinder/chain, and mobilize interim clean water tanker supply.'
      };
    }

    if (category === 'healthcare') {
      return {
        reason: `Critical healthcare cold-chain or facility failure${popText}, creating risk of vaccine or medicine spoilage.`,
        suggestedAction: 'Engage backup emergency inverter/solar power immediately and alert the Block Medical Officer for medical transfer.'
      };
    }

    if (category === 'infrastructure') {
      return {
        reason: `Public safety hazard presenting potential risk to life or severe transit cutoff${popText}.`,
        suggestedAction: 'Cordon off the hazardous area, notify emergency public works crew, and post physical safety signage.'
      };
    }

    if (category === 'agriculture') {
      return {
        reason: `Severe agricultural threat (pest outbreak, crop blight, or main irrigation canal failure)${popText}.`,
        suggestedAction: 'Deploy Block Agricultural Field Inspector to take crop samples and coordinate emergency containment protocol.'
      };
    }

    return {
      reason: `High-urgency civic incident requiring immediate priority intervention${popText}.`,
      suggestedAction: 'Verify field report with village panchayat administrator and assign the primary municipal task response team.'
    };
  }

  if (priority === 'MEDIUM') {
    if (category === 'water_supply') {
      return {
        reason: `Moderate water infrastructure issue (low pressure, secondary leak, or planned maintenance)${popText}.`,
        suggestedAction: 'Schedule on-site technical inspection within 48 hours to assess parts needed and check pump static water level.'
      };
    }

    if (category === 'infrastructure') {
      return {
        reason: `Local road, culvert, or street lighting deterioration causing public inconvenience${popText}.`,
        suggestedAction: 'Record road/structure dimensions in offline incident log and add to upcoming block maintenance schedule.'
      };
    }

    if (category === 'agriculture') {
      return {
        reason: `Agricultural drainage, minor canal seepage, or localized pest signs${popText}.`,
        suggestedAction: 'Notify farmer cooperative representative and inspect field perimeter during next scheduled extension visit.'
      };
    }

    return {
      reason: `Standard civic operational task with moderate community impact${popText}.`,
      suggestedAction: 'Conduct preliminary field inspection to confirm damage extent and prepare required repair materials list.'
    };
  }

  // LOW Priority
  return {
    reason: `Routine non-critical maintenance or scheduled civic survey with low immediate disruption${popText}.`,
    suggestedAction: 'Queue in regular weekly maintenance route; review status during routine monthly field inspection.'
  };
}

/**
 * Maps assistant priority to the legacy TaskRecord priority.
 */
export function mapAssistantToLegacyPriority(priority: AssistantPriority): TaskPriority {
  switch (priority) {
    case 'HIGH':
      return 'high';
    case 'MEDIUM':
      return 'medium';
    case 'LOW':
      return 'low';
  }
}

/**
 * Maps legacy TaskRecord priority to assistant priority.
 */
export function mapLegacyToAssistantPriority(legacyPriority?: TaskPriority): AssistantPriority {
  if (legacyPriority === 'critical' || legacyPriority === 'high') {
    return 'HIGH';
  }
  if (legacyPriority === 'low') {
    return 'LOW';
  }
  return 'MEDIUM';
}

/**
 * Filter helper to match a task against an assistant priority filter ('ALL' | 'HIGH' | 'MEDIUM' | 'LOW').
 */
export function matchesPriorityFilter(task: Partial<TaskRecord>, filter: string): boolean {
  if (!filter || filter === 'all' || filter === 'ALL') return true;
  const evaluation = evaluateTaskPriority(task);
  return evaluation.priority === filter.toUpperCase();
}
