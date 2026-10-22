interface Props {
  onSelect: (message: string) => void;
  disabled: boolean;
}

const QUICK_OPTIONS = [
  { text: 'Comprar', message: 'Quero fazer uma compra' },
  { text: 'Produtos', message: 'Mostre os produtos disponíveis' },
  { text: 'Buscar', message: 'Quero buscar um produto' },
  { text: 'Ajuda', message: 'Como funciona a loja?' },
];

export function QuickButtons({ onSelect, disabled }: Props) {
  return (
    <div className="quick-buttons">
      {QUICK_OPTIONS.map((option, index) => (
        <button
          key={index}
          onClick={() => onSelect(option.message)}
          disabled={disabled}
          className="quick-button"
        >
          <span className="quick-text">{option.text}</span>
        </button>
      ))}
    </div>
  );
}
