import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    texto: string;
    children: React.ReactNode;
    posicao?: 'top' | 'bottom' | 'left' | 'right';
    atraso?: number;
}

/**
 * Componente de Tooltip Robusto e Premium.
 * Usa Portals para evitar cortes de overflow e cálculos de posição dinâmica 
 * para garantir que o tooltip apareça sempre acima de tudo.
 */
export function Tooltip({ texto, children, posicao = 'top', atraso = 300 }: TooltipProps) {
    const [visivel, setVisivel] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<any>(null);

    // Atualiza a posição baseada no trigger
    const atualizarPosicao = () => {
        if (!triggerRef.current || !visivel) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        let top = 0;
        let left = 0;

        // Cálculo base de posição (centralizado no trigger)
        switch (posicao) {
            case 'top':
                top = rect.top + scrollY - 8; // 8px de respiro
                left = rect.left + scrollX + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + scrollY + 8;
                left = rect.left + scrollX + rect.width / 2;
                break;
            case 'left':
                top = rect.top + scrollY + rect.height / 2;
                left = rect.left + scrollX - 8;
                break;
            case 'right':
                top = rect.top + scrollY + rect.height / 2;
                left = rect.right + scrollX + 8;
                break;
        }

        setCoords({ top, left });
    };

    // Reposiciona quando visível ou quando a janela muda
    useLayoutEffect(() => {
        if (visivel) {
            atualizarPosicao();
            window.addEventListener('scroll', atualizarPosicao, true);
            window.addEventListener('resize', atualizarPosicao);
        }
        return () => {
            window.removeEventListener('scroll', atualizarPosicao, true);
            window.removeEventListener('resize', atualizarPosicao);
        };
    }, [visivel]);

    const mostrar = () => {
        timeoutRef.current = setTimeout(() => {
            setVisivel(true);
        }, atraso);
    };

    const esconder = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setVisivel(false);
    };

    const classesPosicao = {
        top: '-translate-x-1/2 -translate-y-full mb-1',
        bottom: '-translate-x-1/2 mt-1',
        left: '-translate-x-full -translate-y-1/2 mr-1',
        right: 'translate-y-1/2 ml-1' // Ajustado para não colidir
    };

    // Classes dinâmicas para o quadrado rotacionado que forma a "setinha"
    const classesSeta = {
        top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45',
        bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45',
        left: 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45',
        right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45'
    };

    // Ajuste fino para a posição RIGHT (que estava estranha)
    const estiloExtra = posicao === 'right' ? { transform: 'translateY(-50%)' } : {};

    return (
        <div 
            ref={triggerRef}
            className="relative inline-flex items-center justify-center cursor-help"
            onMouseEnter={mostrar}
            onMouseLeave={esconder}
        >
            {children}
            {visivel && createPortal(
                <div 
                    ref={tooltipRef}
                    style={{ 
                        position: 'absolute', 
                        top: coords.top, 
                        left: coords.left,
                        zIndex: 99999,
                        ...estiloExtra
                    }}
                    className={`pointer-events-none animate-in fade-in zoom-in-95 duration-200 ${classesPosicao[posicao]}`}
                >
                    <div className="relative px-3 py-1.5 bg-slate-950 text-white text-[9px] font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)] whitespace-nowrap border border-white/10">
                        {texto}
                        {/* Seta (Pointer) - Quadrado rotacionado 45° */}
                        <div className={`absolute w-2 h-2 bg-slate-950 border border-white/5 ${classesSeta[posicao]}`} />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
