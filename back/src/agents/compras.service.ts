import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService, ChatMessage } from './openai.service';
import { ToolsService } from './tools.service';
import { DatabaseService } from '../database/database.service';
import { PedidoPendente } from '../utils/schemas';
import * as fs from 'fs';
import * as path from 'path';

const MAX_ITERACOES = 8;

interface CompraResult {
  resposta: string;
  pendenteAprovacao?: PedidoPendente;
}

@Injectable()
export class ComprasService {
  private readonly logger = new Logger(ComprasService.name);
  private readonly systemPrompt: string;

  constructor(
    private readonly openai: OpenAIService,
    private readonly tools: ToolsService,
    private readonly db: DatabaseService,
  ) {
    const promptPath = path.join(__dirname, '..', 'prompts', 'agente-compras.md');
    try {
      this.systemPrompt = fs.readFileSync(promptPath, 'utf-8');
    } catch {
      this.systemPrompt = `Você é um assistente de vendas da Loja FAEX. Ajude clientes a encontrar e comprar produtos.`;
      this.logger.warn('Arquivo de prompt não encontrado, usando prompt padrão');
    }
  }

  async processar(sessionId: string, mensagem: string): Promise<CompraResult> {
    const historico = await this.carregarHistorico(sessionId);
    
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...historico,
      { role: 'user', content: mensagem },
    ];

    await this.salvarMensagem(sessionId, 'user', mensagem);

    let pendenteAprovacao: PedidoPendente | undefined;
    let iteracao = 0;
    let finalResponse = '';

    while (iteracao < MAX_ITERACOES) {
      iteracao++;
      this.logger.log(`Iteração ${iteracao}/${MAX_ITERACOES}`);

      try {
        const response = await this.openai.complete({
          messages,
          tools: this.tools.getCompraTools(),
          tool_choice: 'auto',
        });

        const choice = response?.choices[0];
        if (!choice) {
          finalResponse = 'Desculpe, não consegui processar sua solicitação.';
          break;
        }

        const assistantMessage = choice.message;
        
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          messages.push({
            role: 'assistant',
            content: assistantMessage.content || '',
            tool_calls: assistantMessage.tool_calls,
          });

          for (const toolCall of assistantMessage.tool_calls) {
            const toolName = toolCall.function.name;
            let toolArgs: any;
            
            try {
              toolArgs = JSON.parse(toolCall.function.arguments);
            } catch {
              toolArgs = {};
            }

            this.logger.log(`Tool: ${toolName} | Args: ${JSON.stringify(toolArgs)}`);

            const toolResult = await this.tools.executeTool(toolName, toolArgs, sessionId);
            
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult.success ? toolResult.result : { erro: toolResult.error }),
            });

            if (toolName === 'criar_pedido' && toolResult.success) {
              pendenteAprovacao = {
                pedidoId: toolResult.result.pedidoId,
                itens: toolResult.result.itens,
                total: parseFloat(toolResult.result.total.replace('R$ ', '').replace(',', '.')),
              };
            }
          }
        } else {
          finalResponse = assistantMessage.content || 'Como posso ajudá-lo com sua compra?';
          break;
        }
      } catch (error: any) {
        this.logger.error('Erro no loop de compras:', error.message);
        finalResponse = this.openai.formatFriendlyError(error);
        break;
      }
    }

    if (!finalResponse && iteracao >= MAX_ITERACOES) {
      finalResponse = 'Desculpe, a operação ficou muito complexa. Por favor, tente simplificar seu pedido.';
    }

    await this.salvarMensagem(sessionId, 'assistant', finalResponse);

    return { resposta: finalResponse, pendenteAprovacao };
  }

  private async carregarHistorico(sessionId: string): Promise<ChatMessage[]> {
    const result = await this.db.query<{ role: string; content: string }>(
      `SELECT role, content FROM conversas WHERE session_id = $1 ORDER BY criado_em DESC LIMIT 20`,
      [sessionId]
    );
    
    return result.rows.reverse().map(row => ({
      role: row.role as 'user' | 'assistant',
      content: row.content,
    }));
  }

  private async salvarMensagem(sessionId: string, role: string, content: string): Promise<void> {
    await this.db.query(
      `INSERT INTO conversas (session_id, role, content) VALUES ($1, $2, $3)`,
      [sessionId, role, content]
    );
  }
}
