import { ChatResponse, Produto } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function enviarMensagem(
  sessionId: string,
  mensagem: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, mensagem }),
  });

  if (!response.ok) {
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function aprovarPedido(pedidoId: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/pedidos/${pedidoId}/aprovar`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao aprovar pedido');
  }

  return response.json();
}

export async function rejeitarPedido(pedidoId: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/pedidos/${pedidoId}/rejeitar`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao rejeitar pedido');
  }

  return response.json();
}

export async function listarProdutos(termo?: string): Promise<Produto[]> {
  const params = new URLSearchParams();
  if (termo) params.append('termo', termo);

  const url = `${API_URL}/produtos${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erro ao carregar produtos');
  }

  return response.json();
}

export async function verificarHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
