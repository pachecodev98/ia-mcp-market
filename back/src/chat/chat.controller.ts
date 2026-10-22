import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestSchema, ChatResponse } from '../utils/schemas';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: any): Promise<ChatResponse> {
    try {
      const validated = ChatRequestSchema.parse(body);
      return this.chatService.processar(validated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        throw new HttpException(
          { error: 'Dados inválidos', details: error.errors },
          HttpStatus.BAD_REQUEST
        );
      }
      throw new HttpException(
        { error: 'Erro interno', message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
