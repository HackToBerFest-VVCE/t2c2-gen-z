import { db } from '../db';
import type { TaskRecord, AgentOutput } from '../types';
import type { LocalModelProvider, AgentExecutionTraceStep } from './types';
import { deterministicAgent } from './deterministic';
import { ollamaAgent } from './ollama';

class AgentRunner {
  private activeProvider: LocalModelProvider = deterministicAgent;
  private isProcessingQueue = false;

  getProvider(): LocalModelProvider {
    return this.activeProvider;
  }

  setProvider(providerId: 'deterministic' | 'ollama'): void {
    if (providerId === 'ollama') {
      this.activeProvider = ollamaAgent;
    } else {
      this.activeProvider = deterministicAgent;
    }
  }

  async runSingleTask(
    task: TaskRecord,
    onTraceStep?: (step: AgentExecutionTraceStep) => void
  ): Promise<TaskRecord> {
    const traceSteps: AgentExecutionTraceStep[] = [];
    const handleTrace = (step: AgentExecutionTraceStep) => {
      traceSteps.push(step);
      if (onTraceStep) onTraceStep(step);
    };

    handleTrace({
      step: 0,
      name: 'Agent Initialized',
      status: 'completed',
      detail: `Allocating local runtime on node '${task.device_id}'. Provider: ${this.activeProvider.name}`,
      timestamp: new Date().toISOString()
    });

    // Mark task as processing in IndexedDB
    task.status = 'processing';
    await db.tasks.put(task);

    try {
      const output: AgentOutput = await this.activeProvider.processTask(
        task.description,
        { location: task.location, title: task.title },
        handleTrace
      );

      task.category = output.category;
      task.priority = output.priority;
      task.confidence_score = output.confidence_score;
      task.affected_population = output.affected_population || task.affected_population;
      task.location = output.location || task.location;
      task.agent_output = output;
      task.status = 'completed_local';
      task.client_updated_at = new Date().toISOString();
      task.updated_at = new Date().toISOString();
      task.revision = (task.revision || 1) + 1;

      // Update in local IndexedDB
      await db.tasks.put(task);

      // Enqueue to sync outbox
      const existingOutbox = await db.syncOutbox.where('task_id').equals(task.id).first();
      if (existingOutbox) {
        await db.syncOutbox.update(existingOutbox.id, {
          payload: task,
          status: 'pending',
          retry_count: 0
        });
      } else {
        await db.syncOutbox.add({
          id: `outbox-${task.id}-${Date.now()}`,
          task_id: task.id,
          action: 'create',
          payload: task,
          status: 'pending',
          retry_count: 0,
          created_at: new Date().toISOString()
        });
      }

      // Add to local audit log
      await db.auditLogs.add({
        id: `audit-${task.id}-${Date.now()}`,
        task_id: task.id,
        action: 'agent_executed_local',
        actor: `local_agent:${this.activeProvider.id}`,
        details: `Task processed offline with ${output.actions.length} action items. Priority: ${output.priority}.`,
        timestamp: new Date().toISOString()
      });

      handleTrace({
        step: 7,
        name: 'IndexedDB Persist & Outbox Queued',
        status: 'completed',
        detail: `Successfully persisted task '${task.id}' to local IndexedDB and enqueued to Sync Outbox.`,
        timestamp: new Date().toISOString()
      });

      return task;
    } catch (error: any) {
      task.status = 'draft';
      await db.tasks.put(task);
      handleTrace({
        step: 99,
        name: 'Execution Failed',
        status: 'failed',
        detail: `Agent processing error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Resume or process all queued offline tasks on startup or reconnection
  async processQueuedTasks(): Promise<number> {
    if (this.isProcessingQueue) return 0;
    this.isProcessingQueue = true;

    try {
      const queued = await db.tasks.where('status').equals('queued').toArray();
      let count = 0;
      for (const task of queued) {
        await this.runSingleTask(task);
        count++;
      }
      return count;
    } finally {
      this.isProcessingQueue = false;
    }
  }
}

export const agentRunner = new AgentRunner();
