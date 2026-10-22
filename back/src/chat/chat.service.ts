import { Injectable, Logger } from '@nestjs/common';
import { ComprasService } from '../agents/compras.service';
import { ChatRequest, ChatResponse } from '../utils/schemas';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly compras: ComprasService) {}

  async processar(request: ChatRequest): Promise<ChatResponse> {
    const { sessionId, mensagem } = request;
    
    this.logger.log(`[${sessionId}] Mensagem: "${mensagem.substring(0, 50)}..."`);

    const resultado = await this.compras.processar(sessionId, mensagem);
    
    return {
      resposta: resultado.resposta,
      pendenteAprovacao: resultado.pendenteAprovacao,
    };
  }
}
