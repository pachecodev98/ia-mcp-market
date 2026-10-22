export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ItemPedido {
  produtoId: number;
  produto: string;
  quantidade: number;
  precoUnit: number;
}

export interface PedidoPendente {
  pedidoId: number;
  itens: ItemPedido[];
  total: number;
}

export interface ChatResponse {
  resposta: string;
  pendenteAprovacao?: PedidoPendente;
}

export interface Produto {
  id: number;
  nome: string;
  estoque: number;
  valor: number;
}
