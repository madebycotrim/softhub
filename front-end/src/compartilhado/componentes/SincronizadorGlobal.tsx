import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * Componente que exibe uma barra de progresso sutil no topo da tela
 * sempre que o React Query estiver buscando ou enviando dados em segundo plano.
 * Proporciona feedback imediato sem bloquear a interface.
 */
export function SincronizadorGlobal() {
    const isFetching = useIsFetching();
    const isMutating = useIsMutating();
    const [visivel, setVisivel] = useState(false);

    // Debounce para evitar flashes em requisições ultra rápidas
    useEffect(() => {
        let timeout: any;
        if (isFetching > 0 || isMutating > 0) {
            setVisivel(true);
        } else {
            timeout = setTimeout(() => setVisivel(false), 500);
        }
        return () => clearTimeout(timeout);
    }, [isFetching, isMutating]);

    if (!visivel) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
            <div className="h-[2px] w-full bg-primary/10 overflow-hidden relative">
                <div className="absolute inset-0 bg-primary w-full origin-left animate-progress-bar shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            </div>
            
            {/* Indicador de Status Discreto no canto */}
            <div className="absolute top-2 right-6 flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border/40 rounded-full shadow-lg animar-entrada">
                <div className="relative flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping absolute" />
                    <div className="w-2 h-2 rounded-full bg-primary relative" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/60">
                    {isMutating > 0 ? 'Processando Transferência' : 'Sincronizando Fluxos'}
                </span>
            </div>
        </div>
    );
}
