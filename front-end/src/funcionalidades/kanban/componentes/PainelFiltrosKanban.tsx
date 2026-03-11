import { useState, useEffect } from 'react';
import type { FiltrosKanban } from '@/funcionalidades/kanban/hooks/usarKanban';
import { LABELS_PRIORIDADE } from '@/utilitarios/constantes';
import { usarDebounce } from '@/compartilhado/hooks/usarDebounce';
import { BarraFiltros, FiltroPills } from '@/compartilhado/componentes/BarraFiltros';

interface PainelFiltrosProps {
    filtros: FiltrosKanban;
    aoFiltrar: (filtros: FiltrosKanban) => void;
}

/** Painel de filtros do Kanban padronizado com design premium. */
export function PainelFiltrosKanban({ filtros, aoFiltrar }: PainelFiltrosProps) {
    const [buscaText, setBuscaText] = useState(filtros.busca || '');
    const [prioridades, setPrioridades] = useState<string[]>(filtros.prioridades || []);
    
    const buscaDebounced = usarDebounce(buscaText, 500);

    // Efeito para disparar aoFiltrar quando debounce atualiza
    useEffect(() => {
        if (buscaDebounced !== filtros.busca) {
            aoFiltrar({ ...filtros, busca: buscaDebounced });
        }
    }, [buscaDebounced]);

    const togglePrioridade = (pri: string) => {
        const novo = prioridades.includes(pri)
            ? prioridades.filter(p => p !== pri)
            : [...prioridades, pri];
        setPrioridades(novo);
        aoFiltrar({ ...filtros, prioridades: novo });
    };

    const limparFiltros = () => {
        setBuscaText('');
        setPrioridades([]);
        aoFiltrar({ busca: '', prioridades: [], responsavelId: undefined });
    };

    const temFiltroAtivo = !!(buscaText || prioridades.length > 0 || filtros.responsavelId);

    return (
        <div className="mb-6">
            <BarraFiltros
                busca={buscaText}
                aoMudarBusca={setBuscaText}
                placeholderBusca="Filtrar tarefas no quadro..."
                temFiltrosAtivos={temFiltroAtivo}
                aoLimparFiltros={limparFiltros}
            >
                <FiltroPills 
                    label="Prioridade" 
                    opcoes={LABELS_PRIORIDADE} 
                    valoresAtivos={prioridades} 
                    aoToggle={togglePrioridade} 
                    variante="primary"
                />
            </BarraFiltros>
        </div>
    );
}
