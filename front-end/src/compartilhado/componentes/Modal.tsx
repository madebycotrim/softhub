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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            {/* Overlay Premium: Glassmorphism + Fade In */}
            <div
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-500 pointer-events-auto animate-in fade-in"
                onClick={aoFechar}
                aria-hidden="true"
            />

            {/* Container do Modal: Light Modern Premium */}
            <div
                className={`
                    relative w-full ${larguras[largura]} pointer-events-auto
                    bg-white border border-slate-200 rounded-2xl 
                    shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]
                    flex flex-col max-h-[90vh] overflow-hidden transform transition-all
                    animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-400 ease-out
                `}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-titulo"
            >
                {/* Brilho Superior Sutil (Premium Touch) */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                {/* Header: Clean & Modern */}
                <div className="flex items-center justify-between px-8 py-6 shrink-0 border-b border-slate-100 relative bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                        <h2 id="modal-titulo" className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                            {titulo}
                        </h2>
                    </div>
                    <button
                        onClick={aoFechar}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all duration-200 focus:outline-none group border border-transparent hover:border-slate-200"
                        aria-label="Fechar modal"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Conteúdo com scroll refinado */}
                <div className="flex-1 overflow-y-auto px-8 py-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalElement, document.body);
}
