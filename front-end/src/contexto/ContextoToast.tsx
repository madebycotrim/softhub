import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export type ToastTipo = 'sucesso' | 'erro';

export interface ToastState {
    mensagem: string;
    tipo: ToastTipo;
    id: number;
}

interface ContextoToastData {
    exibirToast: (mensagem: string, tipo?: ToastTipo) => void;
    toasts: ToastState[];
}

const ContextoToast = createContext<ContextoToastData>({} as ContextoToastData);

export function ProvedorToast({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastState[]>([]);
    const contadorRef = useRef(0);

    const exibirToast = useCallback((mensagem: string, tipo: ToastTipo = 'sucesso') => {
        const id = ++contadorRef.current;
        setToasts(prev => [...prev, { mensagem, tipo, id }]);
        
        // Remove automaticamente após 3.5 segundos
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    return (
        <ContextoToast.Provider value={{ exibirToast, toasts }}>
            {children}
            {/* O Container fica aqui para ser global */}
            <ToastContainer toasts={toasts} />
        </ContextoToast.Provider>
    );
}

// Re-importando o Container localmente para o Provedor
import { ToastContainer } from '@/compartilhado/componentes/ToastContainer';

export function usarToast() {
    const contexto = useContext(ContextoToast);
    if (!contexto) {
        throw new Error('usarToast deve ser usado dentro de um ProvedorToast');
    }
    return contexto;
}
