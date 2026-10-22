import { useRef, useEffect, useState } from 'react';
import { useChat } from './hooks/useChat';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { QuickButtons } from './components/QuickButtons';
import { OrderApprovalCard } from './components/OrderApprovalCard';
import { ProductPanel } from './components/ProductPanel';
import './App.css';

function App() {
  const {
    messages,
    isLoading,
    pendingOrder,
    sendMessage,
    handleApproveOrder,
    handleRejectOrder,
    clearChat,
  } = useChat();

  const [showProducts, setShowProducts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <img
            src="/faex-logo.png"
            alt="FAEX - Faculdade de Extrema"
            className="brand-logo"
          />
          <div className="brand-text">
            <h1>Loja FAEX</h1>
            <span className="tagline">Atendimento e compras online</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-products"
            onClick={() => setShowProducts(!showProducts)}
          >
            {showProducts ? 'Chat' : 'Produtos'}
          </button>
          <button className="btn-clear" onClick={clearChat}>
            Novo chat
          </button>
        </div>
      </header>

      <main className="main">
        <div className={`chat-container ${showProducts ? 'with-panel' : ''}`}>
          <div className="messages">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">AT</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {pendingOrder && (
            <OrderApprovalCard
              order={pendingOrder}
              onApprove={handleApproveOrder}
              onReject={handleRejectOrder}
              disabled={isLoading}
            />
          )}

          <QuickButtons onSelect={sendMessage} disabled={isLoading} />

          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>

        {showProducts && (
          <ProductPanel onProductClick={(msg) => {
            setShowProducts(false);
            sendMessage(msg);
          }} />
        )}
      </main>

      <footer className="footer">
        <p>
          Projeto acadêmico · Dados fictícios · <strong>FAEX</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
