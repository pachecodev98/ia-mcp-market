import { useProdutos } from '../hooks/useProdutos';

interface Props {
  onProductClick: (message: string) => void;
}

export function ProductPanel({ onProductClick }: Props) {
  const { produtos, loading } = useProdutos();

  return (
    <div className="product-panel">
      <div className="panel-header">
        <h2>Produtos</h2>
      </div>

      <div className="product-list">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : produtos.length === 0 ? (
          <div className="empty">Nenhum produto encontrado</div>
        ) : (
          produtos.map(produto => (
            <div 
              key={produto.id} 
              className="product-card"
              onClick={() => onProductClick(`Quero saber mais sobre ${produto.nome.split(' - ')[0]}`)}
            >
              <div className="product-name">{produto.nome}</div>
              <div className="product-price">R$ {produto.valor.toFixed(2)}</div>
              <div className={`product-stock ${produto.estoque > 0 ? 'in-stock' : 'out-stock'}`}>
                {produto.estoque > 0 ? `${produto.estoque} em estoque` : 'Sem estoque'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
