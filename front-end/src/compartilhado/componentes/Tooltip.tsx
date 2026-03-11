import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    texto: string;
    children: React.ReactNode;
    posicao?: 'top' | 'bottom' | 'left' | 'right';
    atraso?: number;
}

/**
 * Componente de Tooltip minimalista e premium.
 * Exibe um rótulo flutuante ao passar o mouse sobre elementos (especialmente botões de ícone).
 */
export function Tooltip({ texto, children, posicao = 'top', atraso = 300 }: TooltipProps) {
    const [visivel, setVisivel] = useState(false);
    const timeoutRef = useRef<any>(null);

    const mostrar = () => {
        timeoutRef.current = setTimeout(() => {
            setVisivel(true);
        }, atraso);
    };

    const esconder = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setVisivel(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const classesPosicao = {
        top: '-top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-1',
        bottom: '-bottom-2 left-1/2 -translate-x-1/2 translate-y-full mt-1',
        left: 'top-1/2 -left-2 -translate-x-full -translate-y-1/2 mr-1',
        right: 'top-1/2 -right-2 translate-x-full -translate-y-1/2 ml-1'
    };

    const classesSeta = {
        top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-slate-900',
        bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-slate-900',
        left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-slate-900',
        right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-slate-900'
    };

    return (
        <div 
            className="relative inline-flex items-center justify-center"
            onMouseEnter={mostrar}
            onMouseLeave={esconder}
        >
            {children}
            {visivel && (
                <div className={`absolute z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-200 ${classesPosicao[posicao]}`}>
                    <div className="relative px-2.5 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-2xl whitespace-nowrap border border-white/10">
                        {texto}
                        <div className={`absolute w-0 h-0 border-4 border-transparent ${classesSeta[posicao]}`} />
                    </div>
                </div>
            )}
        </div>
    );
}
