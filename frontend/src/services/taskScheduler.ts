import { db } from '../db';
import type { ScheduledTaskItem } from '../types';
import { resourceManager } from './resourceManager';
import { networkSimulator } from './networkSimulator';

class ResourceAwareTaskScheduler {
  private isProcessing: boolean = false;
  private listeners: Array<(tasks: ScheduledTaskItem[]) => void> = [];

  constructor() {
    this.init();
  }

  private async init() {
    // Resume eligible deferred or queued tasks on start
    await this.processQueue();
    // Re-check queue whenever resource state changes
    resourceManager.subscribe(() => {
      this.processQueue();
    });
  }

  public async scheduleTask(
    type: ScheduledTaskItem['type'],
    associatedId: string,
    priority: ScheduledTaskItem['priority'] = 'medium',
    estimatedCostMwh: number = 0.05
  ): Promise<ScheduledTaskItem> {
    // Prevent duplicate active task execution
    const existing = await db.scheduledTasks
      .where('associated_id')
      .equals(associatedId)
      .and(t => t.type === type && (t.status === 'queued' || t.status === 'running'))
      .first();

    if (existing) {
      return existing;
    }

    const newTask: ScheduledTaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      associated_id: associatedId,
      priority,
      estimated_cost_mwh: estimatedCostMwh,
      status: 'queued',
      retry_count: 0,
      last_error: null,
      created_at: new Date().toISOString()
    };

    await db.scheduledTasks.put(newTask);
    this.notify();
    this.processQueue();
    return newTask;
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const resStatus = resourceManager.getStatus();
      const isLowPower = resStatus.lowPowerMode;

      // Priority ordering: critical > high > medium > low
      const priorityOrder: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };

      const queuedTasks = await db.scheduledTasks
        .where('status')
        .anyOf(['queued', 'deferred'])
        .toArray();

      queuedTasks.sort((a, b) => {
        return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
      });

      for (const task of queuedTasks) {
        // If device is in low-power mode, defer non-critical tasks
        if (isLowPower && task.priority !== 'critical') {
          if (task.status !== 'deferred') {
            task.status = 'deferred';
            task.last_error = 'Deferred: Battery level below threshold';
            await db.scheduledTasks.put(task);
          }
          continue;
        }

        // If task requires network and device is offline, defer
        if ((task.type === 'report_sync' || task.type === 'attachment_sync') && !networkSimulator.isEffectivelyOnline()) {
          task.status = 'deferred';
          task.last_error = 'Deferred: Network offline';
          await db.scheduledTasks.put(task);
          continue;
        }

        // Mark as running
        task.status = 'running';
        await db.scheduledTasks.put(task);

        try {
          await this.executeTask(task);
          task.status = 'completed';
          task.last_error = null;
        } catch (err: any) {
          task.retry_count += 1;
          task.last_error = err?.message || 'Execution error';
          if (task.retry_count >= 3) {
            task.status = 'failed';
          } else {
            task.status = 'deferred';
          }
        }

        await db.scheduledTasks.put(task);
      }
    } catch (err) {
      console.warn('Task scheduler error:', err);
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }

  private async executeTask(task: ScheduledTaskItem): Promise<void> {
    // Dynamic import to prevent circular dependency
    const { fieldReportService } = await import('./fieldReportService');
    
    if (task.type === 'report_sync') {
      await fieldReportService.syncReportToServer(task.associated_id);
    } else if (task.type === 'attachment_sync') {
      await fieldReportService.syncAttachmentToServer(task.associated_id);
    }
  }

  public async getRecentTasks(): Promise<ScheduledTaskItem[]> {
    return db.scheduledTasks.orderBy('created_at').reverse().limit(30).toArray();
  }

  public subscribe(listener: (tasks: ScheduledTaskItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private async notify() {
    const tasks = await this.getRecentTasks();
    this.listeners.forEach(l => l(tasks));
  }
}

export const taskScheduler = new ResourceAwareTaskScheduler();
