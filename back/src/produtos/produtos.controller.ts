import { Controller, Get, Query } from '@nestjs/common';
import { ProdutosService } from './produtos.service';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  async listar(@Query('termo') termo?: string) {
    if (termo) {
      return this.produtosService.buscar({ termo });
    }
    return this.produtosService.listar();
  }
}
