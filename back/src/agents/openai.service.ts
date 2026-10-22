import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { logLLMCall } from '../utils/logger';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}

export interface CompletionOptions {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  response_format?: { type: 'json_object' };
  maxRetries?: number;
  timeout?: number;
}

@Injectable()
export class OpenAIService implements OnModuleInit {
  private client: OpenAI | null = null;
  private readonly logger = new Logger(OpenAIService.name);
  private readonly model: string;

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  onModuleInit() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY não definida');
      throw new Error('OPENAI_API_KEY é obrigatória');
    }

    this.client = new OpenAI({ apiKey, timeout: 60000 });
    this.logger.log(`✅ OpenAI configurado com modelo: ${this.model}`);
  }

  async complete(options: CompletionOptions): Promise<ChatCompletion | null> {
    if (!this.client) {
      throw new Error('OpenAI client não inicializado');
    }

    const maxRetries = options.maxRetries ?? 3;
    const timeout = options.timeout ?? 30000;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const start = Date.now();
      try {
        const response = await Promise.race([
          this.client.chat.completions.create({
            model: this.model,
            messages: options.messages as ChatCompletionMessageParam[],
            tools: options.tools as any,
            tool_choice: options.tool_choice as any,
            response_format: options.response_format,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
          ),
        ]) as ChatCompletion;

        const duration = Date.now() - start;
        const toolCall = response.choices[0]?.message?.tool_calls?.[0];

        logLLMCall({
          timestamp: new Date().toISOString(),
          model: this.model,
          prompt_tokens: response.usage?.prompt_tokens,
          completion_tokens: response.usage?.completion_tokens,
          total_tokens: response.usage?.total_tokens,
          duration_ms: duration,
          tool: toolCall?.function?.name,
          tool_args: toolCall?.function?.arguments,
          success: true,
        });

        return response;
      } catch (error: any) {
        const duration = Date.now() - start;
        lastError = error;

        logLLMCall({
          timestamp: new Date().toISOString(),
          model: this.model,
          duration_ms: duration,
          success: false,
          error: error.message,
        });

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn(`Tentativa ${attempt}/${maxRetries} falhou, aguardando ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(`Todas as ${maxRetries} tentativas falharam`);
    throw lastError || new Error('Falha ao completar requisição');
  }

  formatFriendlyError(error: any): string {
    if (error.message?.includes('Timeout')) {
      return 'O servidor demorou para responder. Por favor, tente novamente.';
    }
    if (error.code === 'insufficient_quota') {
      return 'Limite de uso da API atingido. Entre em contato com o suporte.';
    }
    if (error.code === 'invalid_api_key') {
      return 'Erro de configuração do servidor. Entre em contato com o suporte.';
    }
    if (error.status === 429) {
      return 'Muitas requisições. Por favor, aguarde um momento e tente novamente.';
    }
    return 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.';
  }
}
