export type TaskCategory = 
  | 'water_supply' 
  | 'agriculture' 
  | 'healthcare' 
  | 'infrastructure' 
  | 'education' 
  | 'other';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 
  | 'draft' 
  | 'queued' 
  | 'processing' 
  | 'completed_local' 
  | 'syncing' 
  | 'synced' 
  | 'conflict';

export interface AgentActionItem {
  id: string;
  title: string;
  description: string;
  target_role: string;
  urgency: 'immediate' | 'high' | 'medium' | 'routine';
  completed: boolean;
}

export interface AgentOutput {
  category: TaskCategory;
  priority: TaskPriority;
  confidence_score: number;
  summary: string;
  location?: string;
  affected_population: number;
  actions: AgentActionItem[];
  reasoning: string[];
  needs_human_verification: boolean;
  verified_evidence: boolean;
  model_name: string;
  processing_time_ms: number;
  resource_cost_mwh?: number;
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  location?: string;
  affected_population: number;
  confidence_score: number;
  agent_output?: AgentOutput | null;
  verified_evidence: boolean;
  device_id: string;
  revision: number;
  client_updated_at: string;
  created_at: string;
  updated_at: string;
  local_only?: boolean;
}

export interface SyncQueueItem {
  id: string;
  task_id: string;
  action: 'create' | 'update' | 'delete';
  payload: Partial<TaskRecord>;
  status: 'pending' | 'syncing' | 'failed' | 'conflict';
  retry_count: number;
  last_error?: string | null;
  server_task?: Partial<TaskRecord> | null;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  task_id?: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

export interface DeviceTelemetry {
  device_id: string;
  battery_level: number; // 0.0 - 1.0
  is_charging: boolean;
  storage_used_bytes: number;
  storage_total_bytes: number;
  low_power_mode: boolean;
  is_simulated_offline: boolean;
  network_profile: 'online' | '2g_flaky' | 'offline';
  model_provider: 'deterministic' | 'ollama' | 'llamacpp';
  ollama_endpoint: string;
  ollama_model: string;
  battery_threshold: number; // percentage below which agent pauses
}

export type OperatingMode = 'online' | 'hybrid' | 'strict_offline';

export interface FieldReport {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  severity: TaskPriority;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string;
  worker_id: string;
  notes?: string;
  ai_summary?: string;
  ai_status: 'not_requested' | 'pending' | 'processing_local' | 'processing_online' | 'completed' | 'unavailable' | 'failed';
  sync_status: 'draft' | 'pending_sync' | 'syncing' | 'synced' | 'sync_failed';
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface ReportAttachment {
  id: string;
  report_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  data_url: string; // Base64 data URL for durable offline storage & preview
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  created_at: string;
}

export interface ScheduledTaskItem {
  id: string;
  type: 'report_sync' | 'attachment_sync' | 'ai_analysis' | 'task_sync';
  associated_id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimated_cost_mwh: number;
  status: 'queued' | 'running' | 'completed' | 'deferred' | 'failed';
  retry_count: number;
  last_error?: string | null;
  created_at: string;
}

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  language: string;
  timestamp: string;
  provider_used?: string;
  sources?: string[];
  photo_url?: string;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  priority: number;
  sampleQuery: string;
}
