import type { AgentOutput, TaskRecord } from '../types';

export interface AgentExecutionTraceStep {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  detail: string;
  timestamp: string;
}

export interface LocalModelProvider {
  id: string;
  name: string;
  description: string;
  isAvailable(): Promise<boolean>;
  processTask(
    reportText: string, 
    context?: { location?: string; title?: string },
    onTraceStep?: (step: AgentExecutionTraceStep) => void
  ): Promise<AgentOutput>;
}
