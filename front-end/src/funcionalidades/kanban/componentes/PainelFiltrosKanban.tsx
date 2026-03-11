import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import type { FiltrosKanban } from '../hooks/usarKanban';
import { LABELS_PRIORIDADE } from '../../utilitarios/constantes';
import { usarDebounce } from '../../compartilhado/hooks/usarDebounce';

interface PainelFiltrosProps {
    filtros: FiltrosKanban;
    aoFiltrar: (filtros: FiltrosKanban) => void;
}

// Custom Top-Bar component atuando c/ Debounce Time
export function PainelFiltrosKanban({ filtros, aoFiltrar }: PainelFiltrosProps) {
    const [buscaText, setBuscaText] = useState(filtros.busca || '');
    const [prioridades, setPrioridades] = useState<string[]>(filtros.prioridades || []);
    
    const buscaDebounced = usarDebounce(buscaText, 500);

    // Efeito para disparar aoFiltrar quando debounce atualiza
    useEffect(() => {
        aoFiltrar({ ...filtros, busca: buscaDebounced, prioridades });
    }, [buscaDebounced]);

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
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-2 mb-2 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-xl shadow-sm">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 opacity-50 px-3">
                        <Filter className="w-3 h-3" />
                        Prioridade
                    </span>
                    <div className="flex items-center gap-1 pr-1">
                        {Object.entries(LABELS_PRIORIDADE).map(([key, label]) => {
                            const ativo = prioridades.includes(key);
                            return (
                                <button
                                    key={key}
                                    onClick={() => togglePrioridade(key)}
                                    className={`transition-all px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight ${
                                        ativo 
                                        ? 'bg-primary text-primary-foreground shadow-sm' 
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground opacity-60'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {temFiltroSimples && (
                    <button
                        onClick={limparFiltros}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors px-2"
                    >
                        <X className="w-3 h-3" /> Limpar
                    </button>
                )}
            </div>
        </div>
    );
}
