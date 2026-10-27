import Dexie, { type Table } from 'dexie';
import type { 
  TaskRecord, 
  SyncQueueItem, 
  AuditLogItem, 
  FieldReport, 
  ReportAttachment, 
  ScheduledTaskItem, 
  VoiceMessage 
} from '../types';

export interface SettingItem {
  key: string;
  value: any;
}

export interface VoiceConversationItem {
  id: string;
  language: string;
  messages: VoiceMessage[];
  updated_at: string;
}

export class FieldPilotDatabase extends Dexie {
  tasks!: Table<TaskRecord, string>;
  syncOutbox!: Table<SyncQueueItem, string>;
  auditLogs!: Table<AuditLogItem, string>;
  settings!: Table<SettingItem, string>;
  reports!: Table<FieldReport, string>;
  attachments!: Table<ReportAttachment, string>;
  scheduledTasks!: Table<ScheduledTaskItem, string>;
  voiceConversations!: Table<VoiceConversationItem, string>;

  constructor() {
    super('FieldPilotDB');
    this.version(1).stores({
      tasks: 'id, status, priority, category, revision, client_updated_at, created_at',
      syncOutbox: 'id, task_id, status, retry_count, created_at',
      auditLogs: 'id, task_id, action, timestamp',
      settings: 'key'
    });

    this.version(2).stores({
      tasks: 'id, status, priority, category, revision, client_updated_at, created_at',
      syncOutbox: 'id, task_id, status, retry_count, created_at',
      auditLogs: 'id, task_id, action, timestamp',
      settings: 'key',
      reports: 'id, category, severity, sync_status, created_at, updated_at',
      attachments: 'id, report_id, mime_type, sync_status, created_at',
      scheduledTasks: 'id, type, associated_id, priority, status, created_at',
      voiceConversations: 'id, language, updated_at'
    });
  }
}

export const db = new FieldPilotDatabase();

// Seed initial benchmark demo data if local DB is fresh
export async function initializeDatabase() {
  const taskCount = await db.tasks.count();
  if (taskCount === 0) {
    const demoTask: TaskRecord = {
      id: 'task-demo-handpump-school',
      title: 'Village Primary School Hand Pump Outage',
      description: 'The hand pump near the village primary school has stopped working. Around 40 families depend on it.',
      category: 'water_supply',
      priority: 'critical',
      status: 'completed_local',
      location: 'Near Village Primary School, Sector 2',
      affected_population: 40,
      confidence_score: 0.94,
      verified_evidence: false,
      device_id: 'field-node-alpha',
      revision: 1,
      client_updated_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      agent_output: {
        category: 'water_supply',
        priority: 'critical',
        confidence_score: 0.94,
        summary: 'Critical water source outage impacting primary school children and ~40 dependent rural households.',
        location: 'Near Village Primary School, Sector 2',
        affected_population: 40,
        needs_human_verification: true,
        verified_evidence: false,
        model_name: 'FieldPilot Deterministic Rule Engine v1',
        processing_time_ms: 38,
        resource_cost_mwh: 0.04,
        reasoning: [
          "Matched domain patterns: 'hand pump', 'stopped working', 'primary school', '40 families'.",
          "Calculated priority: CRITICAL due to primary school location and 40 dependent families without potable water.",
          "Generated 3 urgent civic action items for block development officer & water works.",
          "Safety Audit: Verified evidence is FALSE. Human physical inspection required."
        ],
        actions: [
          {
            id: 'act-hp-1',
            title: 'Deploy Mechanical Repair Crew',
            description: 'Notify Junior Engineer (Panchayat Water Works) to inspect cylinder, chain, and riser pipe.',
            target_role: 'Water Works Engineer',
            urgency: 'immediate',
            completed: false
          },
          {
            id: 'act-hp-2',
            title: 'Arrange Interim Water Tanker Supply',
            description: 'Coordinate emergency 3,000L clean drinking water delivery for primary school and 40 families.',
            target_role: 'Panchayat Secretary',
            urgency: 'high',
            completed: false
          },
          {
            id: 'act-hp-3',
            title: 'Water Quality & Borewell Static Level Check',
            description: 'Test water salinity, turbidity, and verify if groundwater table dropped below suction limit.',
            target_role: 'Field Health Inspector',
            urgency: 'medium',
            completed: false
          }
        ]
      }
    };

    await db.tasks.add(demoTask);

    // Also queue into sync outbox so the user sees sync functionality in action
    await db.syncOutbox.add({
      id: 'outbox-demo-01',
      task_id: demoTask.id,
      action: 'create',
      payload: demoTask,
      status: 'pending',
      retry_count: 0,
      created_at: new Date().toISOString()
    });

    await db.auditLogs.add({
      id: 'audit-init-01',
      task_id: demoTask.id,
      action: 'task_created_offline',
      actor: 'field-node-alpha',
      details: 'Task initialized in local IndexedDB while offline',
      timestamp: new Date().toISOString()
    });
  }

  // Seed initial demo report if fresh
  const reportCount = await db.reports.count();
  if (reportCount === 0) {
    const demoReport: FieldReport = {
      id: 'report-demo-bund-001',
      title: 'Panchayat Irrigation Canal Embankment Breach',
      description: 'Heavy runoff caused a 4-meter breach in the north distributary canal bund. Water flooding adjacent arecanut plantation and submerging pathway.',
      category: 'agriculture',
      severity: 'high',
      latitude: 12.9716,
      longitude: 77.5946,
      location_name: 'North Distributary Canal Bund, Channapatna Sector',
      worker_id: 'field-officer-karnataka-01',
      notes: 'Sandbags required immediately to prevent further soil erosion.',
      ai_summary: 'High severity irrigation canal breach threatening adjacent plantation; requires emergency sandbag reinforcement.',
      ai_status: 'completed',
      sync_status: 'synced',
      revision: 1,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString()
    };
    await db.reports.add(demoReport);
  }

  // Seed default language setting if not set
  const savedLang = await db.settings.get('voice_copilot_language');
  if (!savedLang) {
    await db.settings.put({ key: 'voice_copilot_language', value: 'kn-IN' });
  }

  // Seed default operating mode if not set
  const savedMode = await db.settings.get('operating_mode');
  if (!savedMode) {
    await db.settings.put({ key: 'operating_mode', value: 'hybrid' });
  }
}
