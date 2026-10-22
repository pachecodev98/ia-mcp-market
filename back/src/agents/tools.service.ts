import { Injectable, Logger } from '@nestjs/common';
import { ProdutosService } from '../produtos/produtos.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { logToolCall } from '../utils/logger';
import {
  BuscarProdutosArgsSchema,
  ConsultarEstoqueArgsSchema,
  CalcularTotalArgsSchema,
  CriarPedidoArgsSchema,
} from '../utils/schemas';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);

  constructor(
    private readonly produtosService: ProdutosService,
    private readonly pedidosService: PedidosService,
  ) {}

  getCompraTools(): ToolDefinition[] {
    return [
      {
        type: 'function',
        function: {
          name: 'buscar_produtos',
          description: 'Busca produtos no catálogo por termo (nome)',
          parameters: {
            type: 'object',
            properties: {
              termo: {
                type: 'string',
                description: 'Termo de busca (nome do produto)',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'consultar_estoque',
          description: 'Consulta o estoque disponível de um produto específico',
          parameters: {
            type: 'object',
            properties: {
              produtoId: {
                type: 'number',
                description: 'ID do produto',
              },
            },
            required: ['produtoId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'calcular_total',
          description: 'Calcula o valor total de uma lista de itens',
          parameters: {
            type: 'object',
            properties: {
              itens: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    produtoId: { type: 'number' },
                    quantidade: { type: 'number' },
                  },
                  required: ['produtoId', 'quantidade'],
                },
              },
            },
            required: ['itens'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'criar_pedido',
          description: 'Cria um pedido pendente de aprovação. Use APENAS quando o cliente confirmar a compra.',
          parameters: {
            type: 'object',
            properties: {
              itens: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    produtoId: { type: 'number' },
                    quantidade: { type: 'number' },
                  },
                  required: ['produtoId', 'quantidade'],
                },
              },
            },
            required: ['itens'],
          },
        },
      },
    ];
  }

  async executeTool(
    toolName: string,
    args: any,
    sessionId: string
  ): Promise<{ success: boolean; result: any; error?: string }> {
    const start = Date.now();
    
    try {
      let result: any;

      switch (toolName) {
        case 'buscar_produtos': {
          const validated = BuscarProdutosArgsSchema.parse(args);
          const produtos = validated.termo 
            ? await this.produtosService.buscar({ termo: validated.termo })
            : await this.produtosService.listar();
          result = produtos.map(p => ({
            id: p.id,
            nome: p.nome,
            preco: `R$ ${p.valor.toFixed(2)}`,
            estoque: p.estoque,
          }));
          break;
        }

        case 'consultar_estoque': {
          const validated = ConsultarEstoqueArgsSchema.parse(args);
          const estoque = await this.produtosService.consultarEstoque(validated.produtoId);
          if (!estoque) {
            result = { erro: 'Produto não encontrado' };
          } else {
            result = {
              produto: estoque.produto,
              estoque: estoque.estoque,
              disponivel: estoque.estoque > 0,
            };
          }
          break;
        }

        case 'calcular_total': {
          const validated = CalcularTotalArgsSchema.parse(args);
          const produtoIds = validated.itens.map(i => i.produtoId);
          const precos = await this.produtosService.obterPrecos(produtoIds);
          
          let total = 0;
          const detalhes = validated.itens.map(item => {
            const info = precos.get(item.produtoId);
            if (!info) return { produtoId: item.produtoId, erro: 'Produto não encontrado' };
            const subtotal = info.preco * item.quantidade;
            total += subtotal;
            return {
              produto: info.nome,
              quantidade: item.quantidade,
              precoUnit: `R$ ${info.preco.toFixed(2)}`,
              subtotal: `R$ ${subtotal.toFixed(2)}`,
            };
          });

          result = { itens: detalhes, total: `R$ ${total.toFixed(2)}` };
          break;
        }

        case 'criar_pedido': {
          const validated = CriarPedidoArgsSchema.parse({ ...args, sessionId });
          const pedido = await this.pedidosService.criar(sessionId, validated.itens);
          result = {
            pedidoId: pedido.pedidoId,
            status: 'pendente_aprovacao',
            itens: pedido.itens,
            total: `R$ ${pedido.total.toFixed(2)}`,
            mensagem: 'Pedido criado! Aguardando aprovação.',
          };
          break;
        }

        default:
          throw new Error(`Tool desconhecida: ${toolName}`);
      }

      const duration = Date.now() - start;
      logToolCall({
        timestamp: new Date().toISOString(),
        tool: toolName,
        args,
        result,
        duration_ms: duration,
        success: true,
      });

      return { success: true, result };
    } catch (error: any) {
      const duration = Date.now() - start;
      logToolCall({
        timestamp: new Date().toISOString(),
        tool: toolName,
        args,
        duration_ms: duration,
        success: false,
        error: error.message,
      });

      return { success: false, result: null, error: error.message };
    }
  }
}
