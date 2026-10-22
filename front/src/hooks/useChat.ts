import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, PedidoPendente } from '../types';
import { enviarMensagem, aprovarPedido, rejeitarPedido } from '../utils/api';

function generateSessionId(): string {
  return 'sess-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PedidoPendente | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Bem-vindo à **Loja FAEX**.\n\nPosso ajudar você a:\n\n**Buscar produtos** — encontre o que procura\n\n**Ver estoque** — confira a disponibilidade\n\n**Fazer pedidos** — monte seu carrinho\n\nComo posso ajudar hoje?',
      timestamp: new Date(),
    }]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await enviarMensagem(sessionIdRef.current, content.trim());

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.resposta,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.pendenteAprovacao) {
        setPendingOrder(response.pendenteAprovacao);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem');
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleApproveOrder = useCallback(async () => {
    if (!pendingOrder) return;

    setIsLoading(true);
    try {
      const result = await aprovarPedido(pendingOrder.pedidoId);
      const message: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'assistant',
        content: `✅ ${result.message}\n\nSeu pedido foi confirmado! Agradecemos a preferência! 🎉`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
      setPendingOrder(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pendingOrder]);

  const handleRejectOrder = useCallback(async () => {
    if (!pendingOrder) return;

    setIsLoading(true);
    try {
      const result = await rejeitarPedido(pendingOrder.pedidoId);
      const message: ChatMessage = {
        id: `system-${Date.now()}`,
        role: 'assistant',
        content: `❌ ${result.message}\n\nTudo bem! Se precisar de algo mais, é só me chamar.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
      setPendingOrder(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pendingOrder]);

  const clearChat = useCallback(() => {
    sessionIdRef.current = generateSessionId();
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Chat reiniciado! Como posso ajudá-lo com suas compras?',
      timestamp: new Date(),
    }]);
    setPendingOrder(null);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    pendingOrder,
    sendMessage,
    handleApproveOrder,
    handleRejectOrder,
    clearChat,
    sessionId: sessionIdRef.current,
  };
}
