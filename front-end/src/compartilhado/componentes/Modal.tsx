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

            {/* Container do Modal: Premium Aesthetics */}
            <div
                className={`
                    relative w-full ${larguras[largura]} pointer-events-auto
                    bg-card/95 backdrop-blur-xl rounded-[28px] 
                    shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]
                    flex flex-col max-h-[90vh] overflow-hidden transform transition-all
                    border border-border/50
                    animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out-expo
                `}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-titulo"
            >
                {/* Brilho Superior Sutil (Premium Touch) */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                {/* Header: Clean & Modern */}
                <div className="flex items-center justify-between px-8 py-6 shrink-0 border-b border-border/40 relative">
                    <div className="flex flex-col gap-0.5">
                        <h2 id="modal-titulo" className="text-lg font-bold text-foreground tracking-tight leading-none uppercase">
                            {titulo}
                        </h2>
                        <div className="h-0.5 w-6 bg-primary rounded-full" />
                    </div>
                    <button
                        onClick={aoFechar}
                        className="p-2 text-muted-foreground/40 hover:text-foreground hover:bg-accent rounded-xl transition-all duration-300 focus:outline-none group"
                        aria-label="Fechar modal"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Conteúdo com scroll refinado */}
                <div className="flex-1 overflow-y-auto px-8 py-8 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalElement, document.body);
}
