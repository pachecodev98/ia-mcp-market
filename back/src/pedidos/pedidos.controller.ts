import { Controller, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PedidosService } from './pedidos.service';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post(':id/aprovar')
  async aprovar(@Param('id') id: string) {
    const pedidoId = parseInt(id, 10);
    if (isNaN(pedidoId)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }

    try {
      const resultado = await this.pedidosService.aprovar(pedidoId);
      return resultado;
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('estoque insuficiente') || error.message.includes('já foi')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Erro ao aprovar pedido', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/rejeitar')
  async rejeitar(@Param('id') id: string) {
    const pedidoId = parseInt(id, 10);
    if (isNaN(pedidoId)) {
      throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
    }

    try {
      const resultado = await this.pedidosService.rejeitar(pedidoId);
      return resultado;
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      if (error.message.includes('já foi')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Erro ao rejeitar pedido', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
