import type { ReactNode } from 'react';
import { BarraLateral } from './BarraLateral';

interface LayoutPrincipalProps {
    children: ReactNode;
}

/**
 * Layout base de todas as páginas internas da aplicação.
 * Toda página interna renderizada pela rota /app usa essa estrutura fixa.
 */
export function LayoutPrincipal({ children }: LayoutPrincipalProps) {
    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
            <BarraLateral />
            <div className="flex flex-col flex-1 overflow-hidden relative">
                <main className="flex-1 overflow-y-auto px-6 pb-6 pt-6 relative z-10 transition-all">
                    {children}
                </main>
            </div>
        </div>
    );
}
