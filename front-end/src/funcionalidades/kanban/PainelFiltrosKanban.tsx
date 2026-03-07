import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { FiltrosKanban } from './usarKanban';
import { LABELS_PRIORIDADE, CORES_PRIORIDADE } from '../../utilitarios/constantes';
import { Emblema } from '../../compartilhado/componentes/Emblema';

interface PainelFiltrosProps {
    filtros: FiltrosKanban;
    aoFiltrar: (filtros: FiltrosKanban) => void;
}

// Custom Top-Bar component atuando c/ Debounce Time
export function PainelFiltrosKanban({ filtros, aoFiltrar }: PainelFiltrosProps) {
    const [buscaText, setBuscaText] = useState(filtros.busca || '');
    const [prioridades, setPrioridades] = useState<string[]>(filtros.prioridades || []);

    // Debounce nativo no React (0.5s)
    useEffect(() => {
        const handler = setTimeout(() => {
            aoFiltrar({ ...filtros, busca: buscaText, prioridades });
        }, 500);
        return () => clearTimeout(handler);
    }, [buscaText]);

    const togglePrioridade = (pri: string) => {
        const novo = prioridades.includes(pri)
            ? prioridades.filter(p => p !== pri)
            : [...prioridades, pri];
        setPrioridades(novo);
        aoFiltrar({ ...filtros, busca: buscaText, prioridades: novo });
    };

    const limparFiltros = () => {
        setBuscaText('');
        setPrioridades([]);
        aoFiltrar({ busca: '', prioridades: [], responsavelId: undefined });
    };

    const temFiltroSimples = buscaText.length > 0 || prioridades.length > 0 || filtros.responsavelId;

    return (
        <div className="bg-card/80 backdrop-blur-md border border-border shadow-sm rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between transition-colors duration-300">
            <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por Título ou Descrição..."
                        value={buscaText}
                        onChange={e => setBuscaText(e.target.value)}
                        className="w-full bg-background/50 border border-input rounded-xl pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                    />
                </div>

                <div className="hidden lg:flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mx-2 flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        Prioridade:
                    </span>
                    {Object.entries(LABELS_PRIORIDADE).map(([key, label]) => {
                        const ativo = prioridades.includes(key);
                        return (
                            <button
                                key={key}
                                onClick={() => togglePrioridade(key)}
                                className={`transition-all rounded-full border border-transparent ${ativo ? 'ring-2 ring-primary/50 scale-105' : 'opacity-60 hover:opacity-100 hover:scale-105'} cursor-pointer`}
                            >
                                <Emblema texto={label} variante={CORES_PRIORIDADE[key as keyof typeof CORES_PRIORIDADE]} className="pointer-events-none" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {temFiltroSimples && (
                <button
                    onClick={limparFiltros}
                    className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                    <X className="w-3 h-3" /> Limpar Filtros
                </button>
            )}
        </div>
    );
}
