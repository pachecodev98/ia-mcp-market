import { z } from 'zod';

export const ItemPedidoSchema = z.object({
  produtoId: z.number(),
  produto: z.string(),
  quantidade: z.number().positive(),
  precoUnit: z.number().positive(),
});

export type ItemPedido = z.infer<typeof ItemPedidoSchema>;

export const PedidoPendenteSchema = z.object({
  pedidoId: z.number(),
  itens: z.array(ItemPedidoSchema),
  total: z.number(),
});

export type PedidoPendente = z.infer<typeof PedidoPendenteSchema>;

export const ChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  mensagem: z.string().min(1),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  resposta: z.string(),
  pendenteAprovacao: PedidoPendenteSchema.optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const BuscarProdutosArgsSchema = z.object({
  termo: z.string().optional(),
});

export const ConsultarEstoqueArgsSchema = z.object({
  produtoId: z.coerce.number().int().positive(),
});

export const CalcularTotalArgsSchema = z.object({
  itens: z.array(z.object({
    produtoId: z.coerce.number().int().positive(),
    quantidade: z.coerce.number().positive(),
  })),
});

export const CriarPedidoArgsSchema = z.object({
  sessionId: z.string(),
  itens: z.array(z.object({
    produtoId: z.coerce.number().int().positive(),
    quantidade: z.coerce.number().positive(),
  })),
});
