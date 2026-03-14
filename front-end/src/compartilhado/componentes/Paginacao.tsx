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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            {/* Info + Seletor */}
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground/50">
                <span>{itensListados} de {totalRegistros}</span>
                <select
                    value={itensPorPagina}
                    onChange={e => aoMudarItensPorPagina(Number(e.target.value))}
                    disabled={desabilitado}
                    className="bg-transparent text-muted-foreground/50 text-[11px] outline-none cursor-pointer appearance-none hover:text-foreground transition-colors disabled:opacity-30"
                >
                    {opcoesItensPorPagina.map(num => (
                        <option key={num} value={num}>{num} por página</option>
                    ))}
                </select>
            </div>

            {/* Navegação */}
            <div className="flex items-center gap-0.5">
                <button
                    disabled={paginaAtual === 1 || desabilitado}
                    onClick={() => aoMudarPagina(1)}
                    className="p-1.5 rounded-md text-muted-foreground/30 hover:text-foreground disabled:opacity-0 disabled:pointer-events-none transition-colors"
                    title="Primeira Página"
                >
                    <ChevronsLeft size={14} />
                </button>

                <button
                    disabled={paginaAtual === 1 || desabilitado}
                    onClick={() => aoMudarPagina(paginaAtual - 1)}
                    className="p-1.5 rounded-md text-muted-foreground/30 hover:text-foreground disabled:opacity-0 disabled:pointer-events-none transition-colors"
                >
                    <ChevronLeft size={14} />
                </button>

                <span className="px-3 text-[11px] text-muted-foreground/50 tabular-nums">
                    {paginaAtual} <span className="text-muted-foreground/20">/</span> {totalPaginas}
                </span>

                <button
                    disabled={paginaAtual === totalPaginas || desabilitado}
                    onClick={() => aoMudarPagina(paginaAtual + 1)}
                    className="p-1.5 rounded-md text-muted-foreground/30 hover:text-foreground disabled:opacity-0 disabled:pointer-events-none transition-colors"
                >
                    <ChevronRight size={14} />
                </button>

                <button
                    disabled={paginaAtual === totalPaginas || desabilitado}
                    onClick={() => aoMudarPagina(totalPaginas)}
                    className="p-1.5 rounded-md text-muted-foreground/30 hover:text-foreground disabled:opacity-0 disabled:pointer-events-none transition-colors"
                    title="Última Página"
                >
                    <ChevronsRight size={14} />
                </button>
            </div>
        </div>
    );
}
