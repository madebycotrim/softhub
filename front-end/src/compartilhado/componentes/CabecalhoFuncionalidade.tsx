import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface CabecalhoFuncionalidadeProps {
    titulo: string;
    subtitulo: string;
    icone: LucideIcon;
    variante?: 'padrao' | 'destaque' | 'perigo';
    children?: React.ReactNode;
}

/**
 * Cabeçalho padronizado para as funcionalidades do sistema.
 * Segue o estilo de card premium com ícone e gradiente lateral.
 */
export function CabecalhoFuncionalidade({
    titulo,
    subtitulo,
    icone: Icone,
    variante = 'padrao',
    children
}: CabecalhoFuncionalidadeProps) {

    const cores = {
        padrao: {
            border: 'border-border',
            bgIcone: 'bg-primary/10',
            textoIcone: 'text-primary',
            gradiente: 'from-primary/5'
        },
        destaque: {
            border: 'border-blue-500/20',
            bgIcone: 'bg-blue-500/10',
            textoIcone: 'text-blue-500',
            gradiente: 'from-blue-500/5'
        },
        perigo: {
            border: 'border-destructive/20',
            bgIcone: 'bg-destructive/10',
            textoIcone: 'text-destructive',
            gradiente: 'from-destructive/5'
        }
    };

    const estilo = cores[variante];

    return (
        <div className={`shrink-0 flex items-center justify-between bg-card border ${estilo.border} rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all`}>
            <div className="relative z-10 flex items-center gap-4">
                <div className={`p-3 ${estilo.bgIcone} ${estilo.textoIcone} rounded-2xl`}>
                    <Icone className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-card-foreground tracking-tight">
                        {titulo}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">{subtitulo}</p>
                </div>
            </div>

            {/* Slot para botões ou ações à direita */}
            {children && <div className="relative z-10">{children}</div>}

            <div className={`absolute top-0 right-0 w-64 h-full bg-gradient-to-l ${estilo.gradiente} to-transparent pointer-events-none`} />
        </div>
    );
}
