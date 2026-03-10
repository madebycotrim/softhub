import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginacaoProps {
    paginaAtual: number;
    totalPaginas: number;
    totalRegistros: number;
    itensPorPagina: number;
    itensListados: number;
    aoMudarPagina: (pagina: number) => void;
    aoMudarItensPorPagina: (itens: number) => void;
    opcoesItensPorPagina?: number[];
    desabilitado?: boolean;
}

/**
 * Componente universal de Paginação (Footer de Listas).
 * Controla navegação entre páginas e quantidade exibida por página.
 */
export function Paginacao({
    paginaAtual,
    totalPaginas,
    totalRegistros,
    itensPorPagina,
    itensListados,
    aoMudarPagina,
    aoMudarItensPorPagina,
    opcoesItensPorPagina = [20, 50, 100],
    desabilitado = false
}: PaginacaoProps) {
    if (totalRegistros === 0) return null;

    return (
        <div className="p-4 border-t border-border bg-muted/50 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                {/* Selector Itens por Página */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Exibir</span>
                    <select
                        value={itensPorPagina}
                        onChange={e => aoMudarItensPorPagina(Number(e.target.value))}
                        disabled={desabilitado}
                        className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer disabled:opacity-50"
                    >
                        {opcoesItensPorPagina.map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>
                
                <span className="text-xs text-muted-foreground font-medium text-center sm:text-left">
                    Mostrando <span className="text-foreground font-bold">{itensListados}</span> de <span className="text-foreground font-bold">{totalRegistros}</span> registros
                </span>
            </div>

            {/* Controles Nuvem / Botões */}
            <div className="flex items-center justify-center gap-1 w-full sm:w-auto">
                <button
                    disabled={paginaAtual === 1 || desabilitado}
                    onClick={() => aoMudarPagina(1)}
                    className="w-10 h-9 rounded-lg border border-border text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center"
                    title="Primeira Página"
                >
                    <ChevronsLeft className="w-5 h-5" />
                </button>

                <button
                    disabled={paginaAtual === 1 || desabilitado}
                    onClick={() => aoMudarPagina(paginaAtual - 1)}
                    className="h-9 px-3 rounded-lg border border-border text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-xs font-bold hidden sm:inline">Anterior</span>
                </button>

                <div className="flex items-center px-3 sm:px-4 bg-background border border-border rounded-lg h-9">
                    <span className="text-xs font-bold whitespace-nowrap">
                        <span className="text-primary">{paginaAtual}</span>
                        <span className="mx-1 sm:mx-2 text-muted-foreground/40">/</span>
                        <span className="text-muted-foreground">{totalPaginas}</span>
                    </span>
                </div>

                <button
                    disabled={paginaAtual === totalPaginas || desabilitado}
                    onClick={() => aoMudarPagina(paginaAtual + 1)}
                    className="h-9 px-3 rounded-lg border border-border text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
                >
                    <span className="text-xs font-bold hidden sm:inline">Próxima</span>
                    <ChevronRight className="w-5 h-5" />
                </button>

                <button
                    disabled={paginaAtual === totalPaginas || desabilitado}
                    onClick={() => aoMudarPagina(totalPaginas)}
                    className="w-10 h-9 rounded-lg border border-border text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center"
                    title="Última Página"
                >
                    <ChevronsRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
