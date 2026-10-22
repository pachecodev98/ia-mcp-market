import { PedidoPendente } from '../types';

interface Props {
  order: PedidoPendente;
  onApprove: () => void;
  onReject: () => void;
  disabled: boolean;
}

export function OrderApprovalCard({ order, onApprove, onReject, disabled }: Props) {
  return (
    <div className="order-card">
      <div className="order-header">
        <h3>Pedido #{order.pedidoId}</h3>
        <span className="order-status">Aguardando aprovação</span>
      </div>

      <div className="order-items">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Preço Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.itens.map((item, index) => (
              <tr key={index}>
                <td>{item.produto}</td>
                <td>{item.quantidade}</td>
                <td>R$ {item.precoUnit.toFixed(2)}</td>
                <td>R$ {(item.quantidade * item.precoUnit).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}><strong>Total</strong></td>
              <td><strong>R$ {order.total.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="order-actions">
        <button 
          className="btn-approve" 
          onClick={onApprove} 
          disabled={disabled}
        >
          Confirmar pedido
        </button>
        <button 
          className="btn-reject" 
          onClick={onReject} 
          disabled={disabled}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
