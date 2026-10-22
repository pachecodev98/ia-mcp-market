import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ComprasService } from './compras.service';
import { ToolsService } from './tools.service';
import { ProdutosModule } from '../produtos/produtos.module';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  imports: [ProdutosModule, PedidosModule],
  providers: [
    OpenAIService,
    ComprasService,
    ToolsService,
  ],
  exports: [
    OpenAIService,
    ComprasService,
  ],
})
export class AgentsModule {}
