import { useState, useEffect } from 'react';

/**
 * Hook para debouncing de valores (evita múltiplas execuções rápidas).
 */
export function usarDebounce<T>(valor: T, delay = 300): T {
    const [valorDebounced, setValorDebounced] = useState(valor);

    useEffect(() => {
        const timer = setTimeout(() => setValorDebounced(valor), delay);
        return () => clearTimeout(timer);
    }, [valor, delay]);

    return valorDebounced;
}
