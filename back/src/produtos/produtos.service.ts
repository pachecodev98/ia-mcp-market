import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Produto {
  id: number;
  nome: string;
  estoque: number;
  valor: number;
}

function mapProduto(row: { id: unknown; nome: string; estoque: unknown; valor: unknown }): Produto {
  return {
    id: Number(row.id),
    nome: row.nome,
    estoque: Number(row.estoque),
    valor: Number(row.valor),
  };
}

@Injectable()
export class ProdutosService {
  private readonly logger = new Logger(ProdutosService.name);

  constructor(private readonly db: DatabaseService) {}

  async buscar(filtros: { termo?: string }): Promise<Produto[]> {
    let query = 'SELECT id, nome, estoque, valor FROM public."Produtos" WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filtros.termo) {
      query += ` AND LOWER(nome) LIKE LOWER($${paramIndex})`;
      params.push(`%${filtros.termo}%`);
      paramIndex++;
    }

    query += ' ORDER BY nome';

    const result = await this.db.query(query, params);
    return result.rows.map(mapProduto);
  }

  async listar(): Promise<Produto[]> {
    const result = await this.db.query(
      'SELECT id, nome, estoque, valor FROM public."Produtos" ORDER BY nome'
    );
    return result.rows.map(mapProduto);
  }

  async buscarPorId(id: number): Promise<Produto | null> {
    const result = await this.db.query(
      'SELECT id, nome, estoque, valor FROM public."Produtos" WHERE id = $1',
      [id]
    );
    return result.rows[0] ? mapProduto(result.rows[0]) : null;
  }

  async consultarEstoque(produtoId: number): Promise<{ produto: string; estoque: number } | null> {
    const result = await this.db.query<{ nome: string; estoque: unknown }>(
      'SELECT nome, estoque FROM public."Produtos" WHERE id = $1',
      [produtoId]
    );
    if (result.rows.length === 0) return null;
    return { produto: result.rows[0].nome, estoque: Number(result.rows[0].estoque) };
  }

  async obterPrecos(produtoIds: number[]): Promise<Map<number, { nome: string; preco: number }>> {
    if (produtoIds.length === 0) return new Map();
    
    const placeholders = produtoIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await this.db.query<{ id: unknown; nome: string; valor: unknown }>(
      `SELECT id, nome, valor FROM public."Produtos" WHERE id IN (${placeholders})`,
      produtoIds
    );
    
    const map = new Map<number, { nome: string; preco: number }>();
    for (const row of result.rows) {
      map.set(Number(row.id), { nome: row.nome, preco: Number(row.valor) });
    }
    return map;
  }
}
