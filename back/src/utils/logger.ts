import { Logger } from '@nestjs/common';

export interface LLMCallLog {
  timestamp: string;
  model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  duration_ms: number;
  tool?: string;
  tool_args?: any;
  success: boolean;
  error?: string;
}

export interface ToolCallLog {
  timestamp: string;
  tool: string;
  args: any;
  result?: any;
  duration_ms: number;
  success: boolean;
  error?: string;
}

const observabilityLogger = new Logger('Observability');

export function logLLMCall(log: LLMCallLog): void {
  const emoji = log.success ? '✅' : '❌';
  observabilityLogger.log(
    `${emoji} LLM [${log.model}] ${log.duration_ms}ms | tokens: ${log.total_tokens || 'N/A'} | tool: ${log.tool || 'none'}`
  );
  if (log.error) {
    observabilityLogger.error(`   Error: ${log.error}`);
  }
}

export function logToolCall(log: ToolCallLog): void {
  const emoji = log.success ? '🔧' : '💥';
  observabilityLogger.log(
    `${emoji} Tool [${log.tool}] ${log.duration_ms}ms | args: ${JSON.stringify(log.args).substring(0, 100)}`
  );
  if (log.error) {
    observabilityLogger.error(`   Error: ${log.error}`);
  }
}
