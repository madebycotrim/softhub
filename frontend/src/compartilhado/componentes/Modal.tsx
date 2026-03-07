import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
    aberto: boolean;
    aoFechar: () => void;
    titulo: string;
    children: ReactNode;
    largura?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Modal genérico usado em toda a aplicação.
 * Renderizado no Root (document.body) via Portal para evitar problemas de z-index
 */
export function Modal({ aberto, aoFechar, titulo, children, largura = 'md' }: ModalProps) {
    const [montado, setMontado] = useState(false);

    useEffect(() => {
        setMontado(true);

        // Travar rolagem do body quando aberto
        if (aberto) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [aberto]);

    if (!montado || !aberto) return null;

    const larguras = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    const modalElement = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Overlay escuro de fundo */}
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={aoFechar}
                aria-hidden="true"
            />

            {/* Conteúdo do Modal */}
            <div
                className={`relative w-full ${larguras[largura]} bg-white rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] flex flex-col max-h-[95vh] overflow-hidden transform transition-all border border-slate-100/50 scale-100 animate-in fade-in zoom-in-95 duration-500`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-titulo"
            >
                <div className="flex items-center justify-between px-10 py-7 shrink-0 bg-[#003366]">
                    <div className="space-y-1">
                        <h2 id="modal-titulo" className="text-xl font-black text-white tracking-widest uppercase leading-none">
                            {titulo}
                        </h2>
                        <div className="h-1.5 w-10 bg-red-600 rounded-2xl" />
                    </div>
                    <button
                        onClick={aoFechar}
                        className="p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 focus:outline-none active:scale-90"
                        aria-label="Fechar modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Usamos flex-1 e overflow-y-auto no wrapper interno para permitir scrolls compridos dentro do modal */}
                <div className="flex-1 overflow-y-auto px-10 py-10 bg-slate-50/30">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalElement, document.body);
}
