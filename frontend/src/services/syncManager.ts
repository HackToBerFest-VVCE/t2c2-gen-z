import { db } from '../db';
import type { TaskRecord } from '../types';
import { networkSimulator } from './networkSimulator';
import { resourceManager } from './resourceManager';

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  lastError: string | null;
  syncedCount: number;
  conflictCount: number;
  isAutoSyncSuspended?: boolean;
}

type SyncListener = (state: SyncState) => void;

// Permanent client/routing error statuses where repeated automatic retries are futile
const PERMANENT_ERROR_STATUSES = [400, 401, 403, 404, 405, 410, 422];
const MAX_CONSECUTIVE_TRANSIENT_RETRIES = 5;

class SyncManagerService {
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private lastError: string | null = null;
  private isAutoSyncSuspended = false;
  private consecutiveTransientFailures = 0;
  private listeners: Set<SyncListener> = new Set();
  private deviceId = 'node-field-01';

  constructor() {
    // Listen for reconnection to auto-sync
    networkSimulator.subscribe((_, isOnline) => {
      if (isOnline && !this.isAutoSyncSuspended) {
        this.triggerSync({ isManual: false }).catch(() => {});
      }
    });

    // Periodic poll check every 30 seconds if online AND not suspended
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (
          networkSimulator.isEffectivelyOnline() && 
          !this.isSyncing && 
          !this.isAutoSyncSuspended
        ) {
          this.triggerSync({ isManual: false }).catch(() => {});
        }
      }, 30000);
    }
  }

  async getState(): Promise<SyncState> {
    const pendingCount = await db.syncOutbox.where('status').equals('pending').count();
    const conflictCount = await db.tasks.where('status').equals('conflict').count();
    const syncedCount = await db.tasks.where('status').equals('synced').count();

    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingCount,
      lastError: this.lastError,
      syncedCount,
      conflictCount,
      isAutoSyncSuspended: this.isAutoSyncSuspended
    };
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.getState().then(s => listener(s));
    return () => this.listeners.delete(listener);
  }

  private async notify(): Promise<void> {
    const state = await this.getState();
    this.listeners.forEach(cb => cb(state));
  }

  /**
   * Resets any suspension state (e.g. when user clicks manual sync)
   */
  async resetSuspension(): Promise<void> {
    this.isAutoSyncSuspended = false;
    this.consecutiveTransientFailures = 0;
    this.lastError = null;

    // Reset failed outbox items back to pending
    const failedItems = await db.syncOutbox.where('status').equals('failed').toArray();
    for (const item of failedItems) {
      await db.syncOutbox.update(item.id, {
        status: 'pending',
        retry_count: 0,
        last_error: null
      });
    }

    await this.notify();
  }

  async triggerSync(options?: { isManual?: boolean }): Promise<{ pushed: number; pulled: number; conflicts: number }> {
    const isManual = options?.isManual ?? false;

    // Manual sync always clears suspensions and gives the user full control
    if (isManual) {
      await this.resetSuspension();
    }

    if (this.isSyncing) {
      return { pushed: 0, pulled: 0, conflicts: 0 };
    }

    // Do not auto-retry if auto-sync is suspended due to permanent errors
    if (!isManual && this.isAutoSyncSuspended) {
      return { pushed: 0, pulled: 0, conflicts: 0 };
    }

    if (!networkSimulator.isEffectivelyOnline()) {
      this.lastError = 'Device is currently offline. Tasks remain safely queued in local outbox.';
      await this.notify();
      return { pushed: 0, pulled: 0, conflicts: 0 };
    }

    this.isSyncing = true;
    this.lastError = null;
    await this.notify();

    let pushed = 0;
    let pulled = 0;
    let conflicts = 0;

    try {
      // Flaky 2G simulation delay
      if (networkSimulator.isFlaky2G()) {
        await new Promise(r => setTimeout(r, 1200));
      }

      // Step 1: Push Outbox Tasks
      const pendingOutbox = await db.syncOutbox.where('status').equals('pending').toArray();
      
      if (pendingOutbox.length > 0) {
        // Collect task payloads
        const tasksToPush: Partial<TaskRecord>[] = [];
        for (const item of pendingOutbox) {
          const task = await db.tasks.get(item.task_id);
          if (task) {
            tasksToPush.push({
              id: task.id,
              title: task.title,
              description: task.description,
              category: task.category,
              priority: task.priority,
              status: task.status,
              location: task.location,
              affected_population: task.affected_population,
              confidence_score: task.confidence_score,
              agent_output: JSON.stringify(task.agent_output) as any,
              verified_evidence: task.verified_evidence,
              device_id: task.device_id || this.deviceId,
              revision: task.revision || 1,
              client_updated_at: task.client_updated_at || new Date().toISOString()
            });
          }
        }

        if (tasksToPush.length > 0) {
          let pushRes: Response;
          try {
            pushRes = await fetch('/api/sync/push', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                device_id: this.deviceId,
                tasks: tasksToPush,
                client_timestamp: new Date().toISOString()
              })
            });
          } catch (fetchErr: any) {
            // Network connection error (transient)
            this.handleTransientFailure(pendingOutbox, `Network connection error: ${fetchErr.message}`);
            return { pushed: 0, pulled: 0, conflicts: 0 };
          }

          // Check for permanent vs transient HTTP errors
          if (!pushRes.ok) {
            const status = pushRes.status;
            let errorDetail = `Server returned status ${status} (${pushRes.statusText || 'Error'})`;
            
            try {
              const errJson = await pushRes.json();
              if (errJson?.detail) errorDetail += `: ${errJson.detail}`;
              else if (errJson?.message) errorDetail += `: ${errJson.message}`;
            } catch {
              // Non-JSON response (e.g. static HTML 405 error page)
            }

            if (PERMANENT_ERROR_STATUSES.includes(status)) {
              // PERMANENT ERROR (e.g. 405 Method Not Allowed, 404, 401, 403)
              // Suspend auto-retries immediately to avoid flooding network/console
              this.isAutoSyncSuspended = true;
              this.lastError = `Permanent error: ${errorDetail}. Auto-sync paused to avoid console spam. Click 'Trigger Full Sync Now' to retry.`;
              
              for (const item of pendingOutbox) {
                await db.syncOutbox.update(item.id, {
                  last_error: errorDetail
                });
              }

              console.warn(`[FieldPilot Sync] Auto-sync suspended due to permanent error: ${errorDetail}`);
              await this.notify();
              return { pushed: 0, pulled: 0, conflicts: 0 };
            } else {
              // TRANSIENT ERROR (500, 502, 503, 504)
              this.handleTransientFailure(pendingOutbox, errorDetail);
              return { pushed: 0, pulled: 0, conflicts: 0 };
            }
          }

          // Successful push response
          const pushData = await pushRes.json();
          this.consecutiveTransientFailures = 0;
          this.isAutoSyncSuspended = false;

          for (const ack of pushData.results) {
            const outboxItem = pendingOutbox.find(o => o.task_id === ack.task_id);
            if (ack.status === 'acknowledged' || ack.status === 'merged') {
              pushed++;
              if (outboxItem) {
                await db.syncOutbox.delete(outboxItem.id);
              }
              const localTask = await db.tasks.get(ack.task_id);
              if (localTask) {
                localTask.status = 'synced';
                localTask.revision = ack.server_revision;
                await db.tasks.put(localTask);
              }
              await db.auditLogs.add({
                id: `audit-ack-${ack.task_id}-${Date.now()}`,
                task_id: ack.task_id,
                action: 'sync_acknowledged_by_server',
                actor: 'sync_engine',
                details: `Server verified & acknowledged task. Rev: ${ack.server_revision}`,
                timestamp: new Date().toISOString()
              });
            } else if (ack.status === 'conflict') {
              conflicts++;
              if (outboxItem) {
                await db.syncOutbox.update(outboxItem.id, {
                  status: 'conflict',
                  server_task: ack.server_task,
                  last_error: ack.message
                });
              }
              const localTask = await db.tasks.get(ack.task_id);
              if (localTask) {
                localTask.status = 'conflict';
                await db.tasks.put(localTask);
              }
              await db.auditLogs.add({
                id: `audit-conf-${ack.task_id}-${Date.now()}`,
                task_id: ack.task_id,
                action: 'sync_conflict_detected',
                actor: 'sync_engine',
                details: ack.message || 'Conflict detected between local and server revisions.',
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }

      // Step 2: Pull Server Updates (Delta Synchronization)
      try {
        const pullRes = await fetch('/api/sync/pull?limit=50', {
          headers: { 'Accept': 'application/json' }
        });
        if (pullRes.ok) {
          const pullData = await pullRes.json();
          if (Array.isArray(pullData?.tasks)) {
            for (const serverTask of pullData.tasks) {
              const localExisting = await db.tasks.get(serverTask.id);
              if (!localExisting) {
                let agentOutput = null;
                if (serverTask.agent_output) {
                  try {
                    agentOutput = typeof serverTask.agent_output === 'string' 
                      ? JSON.parse(serverTask.agent_output) 
                      : serverTask.agent_output;
                  } catch (e) {}
                }
                await db.tasks.add({
                  ...serverTask,
                  agent_output: agentOutput,
                  status: 'synced'
                });
                pulled++;
              } else if (localExisting.status === 'synced' && serverTask.revision > localExisting.revision) {
                let agentOutput = localExisting.agent_output;
                if (serverTask.agent_output) {
                  try {
                    agentOutput = typeof serverTask.agent_output === 'string' 
                      ? JSON.parse(serverTask.agent_output) 
                      : serverTask.agent_output;
                  } catch (e) {}
                }
                await db.tasks.put({
                  ...serverTask,
                  agent_output: agentOutput,
                  status: 'synced'
                });
                pulled++;
              }
            }
          }
        }
      } catch {
        // Non-critical pull failure
      }

      // Step 3: Telemetry Reporting
      const resStatus = resourceManager.getStatus();
      const currentPending = await db.syncOutbox.where('status').equals('pending').count();
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          device_id: this.deviceId,
          battery_level: resStatus.batteryLevel,
          is_charging: resStatus.isCharging,
          storage_used_bytes: resStatus.storageUsedBytes,
          storage_total_bytes: resStatus.storageTotalBytes,
          pending_outbox_count: currentPending
        })
      }).catch(() => {});

      this.lastSyncTime = new Date().toISOString();
      this.lastError = null;
      this.consecutiveTransientFailures = 0;
    } catch (err: any) {
      this.lastError = err.message || 'Error during synchronization.';
    } finally {
      this.isSyncing = false;
      await this.notify();
    }

    return { pushed, pulled, conflicts };
  }

  private async handleTransientFailure(pendingOutbox: any[], errorDetail: string): Promise<void> {
    this.consecutiveTransientFailures++;
    
    for (const item of pendingOutbox) {
      const newRetries = (item.retry_count || 0) + 1;
      const isExhausted = newRetries >= MAX_CONSECUTIVE_TRANSIENT_RETRIES;
      await db.syncOutbox.update(item.id, {
        retry_count: newRetries,
        status: isExhausted ? 'failed' : 'pending',
        last_error: errorDetail
      });
    }

    if (this.consecutiveTransientFailures >= MAX_CONSECUTIVE_TRANSIENT_RETRIES) {
      this.isAutoSyncSuspended = true;
      this.lastError = `Temporary failures reached retry limit (${MAX_CONSECUTIVE_TRANSIENT_RETRIES}). Auto-sync paused. Click 'Trigger Full Sync Now' to retry.`;
    } else {
      this.lastError = `${errorDetail} (Retry ${this.consecutiveTransientFailures}/${MAX_CONSECUTIVE_TRANSIENT_RETRIES})`;
    }

    await this.notify();
  }

  // Conflict Resolution: Force keep local or keep server
  async resolveConflict(taskId: string, choice: 'keep_local' | 'keep_server' | 'merge'): Promise<void> {
    const outboxItem = await db.syncOutbox.where('task_id').equals(taskId).first();
    const localTask = await db.tasks.get(taskId);
    if (!localTask) return;

    if (choice === 'keep_local') {
      const serverRev = outboxItem?.server_task?.revision || localTask.revision;
      localTask.revision = serverRev + 1;
      localTask.status = 'completed_local';
      await db.tasks.put(localTask);

      if (outboxItem) {
        await db.syncOutbox.update(outboxItem.id, {
          status: 'pending',
          payload: localTask,
          retry_count: 0
        });
      }
    } else if (choice === 'keep_server') {
      if (outboxItem?.server_task) {
        const sTask = outboxItem.server_task;
        let agentOutput = localTask.agent_output;
        if (sTask.agent_output) {
          try {
            agentOutput = typeof sTask.agent_output === 'string' ? JSON.parse(sTask.agent_output) : sTask.agent_output;
          } catch (e) {}
        }
        await db.tasks.put({
          ...localTask,
          ...sTask,
          agent_output: agentOutput,
          status: 'synced'
        });
      }
      if (outboxItem) {
        await db.syncOutbox.delete(outboxItem.id);
      }
    }

    await db.auditLogs.add({
      id: `audit-res-${taskId}-${Date.now()}`,
      task_id: taskId,
      action: 'conflict_resolved_manually',
      actor: 'field_user',
      details: `Conflict manually resolved with strategy: '${choice}'`,
      timestamp: new Date().toISOString()
    });

    await this.notify();
    if (networkSimulator.isEffectivelyOnline()) {
      await this.triggerSync({ isManual: true });
    }
  }
}

export const syncManager = new SyncManagerService();
