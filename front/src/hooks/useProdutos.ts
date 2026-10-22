import { useState, useEffect, useCallback } from 'react';
import { Produto } from '../types';
import { listarProdutos } from '../utils/api';

export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarProdutos();
      setProdutos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    produtos,
    loading,
    error,
    recarregar: carregar,
  };
}
