interface CarregandoProps {
    tamanho?: 'sm' | 'md' | 'lg';
    Centralizar?: boolean;
    className?: string; // Para injeção de cores extra, como bordas coloridas
}

/**
 * Componente unificado para indicar loading global, seção ou inline (botões).
 */
export function Carregando({ tamanho = 'md', Centralizar = true, className = '' }: CarregandoProps) {
    const tamanhosMap = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    const spinnerCSS = `rounded-full border-primary/20 border-t-primary animate-spin animate-[glow-pulse_2s_infinite] flex-shrink-0 ${tamanhosMap[tamanho]} ${className}`;

    if (Centralizar) {
        return (
            <div className="flex items-center justify-center p-4 w-full h-full">
                <div className="flex flex-col items-center gap-3">
                    <div className={spinnerCSS} role="status" aria-label="Carregando">
                        <span className="sr-only">Carregando...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={spinnerCSS} role="status" aria-label="Carregando">
            <span className="sr-only">Carregando...</span>
        </div>
    );
}
