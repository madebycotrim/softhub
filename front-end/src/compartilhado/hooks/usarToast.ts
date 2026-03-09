import { useState, useCallback, useRef } from 'react';

export type ToastTipo = 'sucesso' | 'erro';

export interface ToastState {
    mensagem: string;
    tipo: ToastTipo;
    id: number;
}

export function usarToast() {
    const [toasts, setToasts] = useState<ToastState[]>([]);
    const contadorRef = useRef(0);

    const exibirToast = useCallback((mensagem: string, tipo: ToastTipo = 'sucesso') => {
        const id = ++contadorRef.current;
        setToasts(prev => [...prev, { mensagem, tipo, id }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    return { toasts, exibirToast };
}
