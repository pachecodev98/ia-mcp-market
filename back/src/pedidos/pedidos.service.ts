import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ProdutosService } from '../produtos/produtos.service';
import { ItemPedido } from '../utils/schemas';

export interface Pedido {
  id: number;
  sessionId: string;
  status: 'pendente_aprovacao' | 'confirmado' | 'rejeitado';
  total: number;
  criadoEm: Date;
  itens?: ItemPedido[];
}

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly produtosService: ProdutosService,
  ) {}

  async criar(
    sessionId: string,
    itens: { produtoId: number; quantidade: number }[]
  ): Promise<{ pedidoId: number; itens: ItemPedido[]; total: number }> {
    const produtoIds = itens.map(i => i.produtoId);
    const precos = await this.produtosService.obterPrecos(produtoIds);

    const itensComPreco: ItemPedido[] = [];
    let total = 0;

    for (const item of itens) {
      const info = precos.get(item.produtoId);
      if (!info) {
        throw new Error(`Produto ${item.produtoId} não encontrado`);
      }
      const subtotal = info.preco * item.quantidade;
      total += subtotal;
      itensComPreco.push({
        produtoId: item.produtoId,
        produto: info.nome,
        quantidade: item.quantidade,
        precoUnit: info.preco,
      });
    }

    const pedidoResult = await this.db.query<{ id: number }>(
      `INSERT INTO pedidos (session_id, status, total) VALUES ($1, 'pendente_aprovacao', $2) RETURNING id`,
      [sessionId, total]
    );
    const pedidoId = pedidoResult.rows[0].id;

    for (const item of itensComPreco) {
      await this.db.query(
        `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unit) VALUES ($1, $2, $3, $4)`,
        [pedidoId, item.produtoId, item.quantidade, item.precoUnit]
      );
    }

    this.logger.log(`Pedido ${pedidoId} criado - aguardando aprovação humana`);

    return { pedidoId, itens: itensComPreco, total };
  }

  async aprovar(pedidoId: number): Promise<{ success: boolean; message: string }> {
    return this.db.transaction(async (client) => {
      const pedidoResult = await client.query<{ status: string }>(
        'SELECT status FROM pedidos WHERE id = $1 FOR UPDATE',
        [pedidoId]
      );

      if (pedidoResult.rows.length === 0) {
        throw new Error(`Pedido ${pedidoId} não encontrado`);
      }

      const status = pedidoResult.rows[0].status;
      if (status !== 'pendente_aprovacao') {
        throw new Error(`Pedido ${pedidoId} já foi ${status}`);
      }

      const itensResult = await client.query<{ produto_id: number; quantidade: number }>(
        'SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1',
        [pedidoId]
      );

      for (const item of itensResult.rows) {
        const estoqueResult = await client.query<{ estoque: unknown }>(
          'SELECT estoque FROM public."Produtos" WHERE id = $1 FOR UPDATE',
          [item.produto_id]
        );

        if (estoqueResult.rows.length === 0) {
          throw new Error(`Produto ${item.produto_id} não encontrado`);
        }

        const estoqueAtual = Number(estoqueResult.rows[0].estoque);
        if (estoqueAtual < item.quantidade) {
          throw new Error(
            `Estoque insuficiente para produto ${item.produto_id}: disponível ${estoqueAtual}, solicitado ${item.quantidade}`
          );
        }

        await client.query(
          'UPDATE public."Produtos" SET estoque = estoque - $1 WHERE id = $2',
          [item.quantidade, item.produto_id]
        );
      }

      await client.query(
        "UPDATE pedidos SET status = 'confirmado' WHERE id = $1",
        [pedidoId]
      );

      this.logger.log(`✅ Pedido ${pedidoId} aprovado e estoque baixado`);

      return { success: true, message: `Pedido ${pedidoId} confirmado com sucesso` };
    });
  }

  async rejeitar(pedidoId: number): Promise<{ success: boolean; message: string }> {
    const pedidoResult = await this.db.query<{ status: string }>(
      'SELECT status FROM pedidos WHERE id = $1',
      [pedidoId]
    );

    if (pedidoResult.rows.length === 0) {
      throw new Error(`Pedido ${pedidoId} não encontrado`);
    }

    const status = pedidoResult.rows[0].status;
    if (status !== 'pendente_aprovacao') {
      throw new Error(`Pedido ${pedidoId} já foi ${status}`);
    }

    await this.db.query(
      "UPDATE pedidos SET status = 'rejeitado' WHERE id = $1",
      [pedidoId]
    );

    this.logger.log(`❌ Pedido ${pedidoId} rejeitado`);

    return { success: true, message: `Pedido ${pedidoId} rejeitado` };
  }

  async obterPorId(pedidoId: number): Promise<Pedido | null> {
    const result = await this.db.query<any>(
      `SELECT id, session_id as "sessionId", status, total::float, criado_em as "criadoEm" 
       FROM pedidos WHERE id = $1`,
      [pedidoId]
    );
    return result.rows[0] || null;
  }
}
