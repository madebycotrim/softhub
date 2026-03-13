import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    useDroppable
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { FolderKanban, Circle, Zap, Search, CheckCircle2, Plus } from 'lucide-react';

import { usarKanban } from '@/funcionalidades/kanban/hooks/usarKanban';
import type { Tarefa } from '@/funcionalidades/kanban/hooks/usarKanban';
import { usarBacklog } from '@/funcionalidades/backlog/hooks/usarBacklog';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarProjetos } from '@/funcionalidades/projetos/hooks/usarProjetos';
import { COLUNAS_KANBAN } from '@/utilitarios/constantes';
import type { ColunaKanban as ColunaTipo } from '@/utilitarios/constantes';

import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { CartaoTarefa } from './CartaoTarefa';
import { PainelFiltrosKanban } from './PainelFiltrosKanban';
import { ModalDetalhesTarefa } from './ModalDetalhesTarefa';
import { ModalCriarTarefa } from '@/funcionalidades/backlog/componentes/ModalCriarTarefa';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';

const LABELS_COLUNAS: Record<string, string> = {
    todo: 'A Fazer',
    in_progress: 'Em Andamento',
    em_revisao: 'Em Revisão',
    concluida: 'Concluído'
};

import { ColunaDropZone } from './ColunaDropZone';
import { KanbanVazioProjetos } from './KanbanVazioProjetos';

export const QuadroKanban = memo(() => {
    const { projetoAtivoId } = usarAutenticacao();
    const { projetos, carregando: carregandoProjetos } = usarProjetos();
    
    const [filtros, setFiltros] = useState<any>({});
    const { tarefas, carregando, erro, moverCard } = usarKanban(projetoAtivoId, filtros);
    const [activeTarefa, setActiveTarefa] = useState<Tarefa | null>(null);
    const [tarefaDetalhes, setTarefaDetalhes] = useState<Tarefa | null>(null);
    const [modalCriarAberto, setModalCriarAberto] = useState(false);

    const podeMover = usarPermissaoAcesso('tarefas:mover');
    const podeCriar = usarPermissaoAcesso('tarefas:criar');
    const podeGerenciarProjetos = usarPermissaoAcesso('projetos:visualizar');

    const { criarTarefa } = usarBacklog(projetoAtivoId);

    const tarefasPorStatus = useMemo(() => {
        const agrupado: Record<string, Tarefa[]> = { todo: [], in_progress: [], em_revisao: [], concluida: [] };
        tarefas.forEach((t: Tarefa) => {
            if (agrupado[t.status]) agrupado[t.status].push(t);
        });
        return agrupado;
    }, [tarefas]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const temFiltroAtivo = !!(filtros.busca || filtros.prioridades?.length || filtros.responsavelId);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (!podeMover) return;
        const { active } = event;
        const t = tarefas.find((item: Tarefa) => item.id === active.id);
        if (t) setActiveTarefa(t);
    }, [podeMover, tarefas]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        if (!podeMover) return;
        const { active, over } = event;
        setActiveTarefa(null);
        if (!over) return;
        const tarefaId = active.id as string;
        const colDestino = over.id as string;
        const t = tarefas.find((item: Tarefa) => item.id === tarefaId);
        if (t && t.status !== colDestino) {
            moverCard(tarefaId, colDestino as any);
        }
    }, [podeMover, tarefas, moverCard]);

    const handleFiltrar = useCallback((f: any) => setFiltros(f), []);
    const handleFecharDetalhes = useCallback(() => setTarefaDetalhes(null), []);
    const handleAbrirCriar = useCallback(() => setModalCriarAberto(true), []);
    const handleFecharCriar = useCallback(() => setModalCriarAberto(false), []);
    const handleLimparFiltros = useCallback(() => setFiltros({}), []);
    const handleCriarTarefa = useCallback(async (dados: any) => {
        await criarTarefa({ ...dados, status: 'todo' });
        setModalCriarAberto(false);
    }, [criarTarefa]);

    if (carregandoProjetos) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Carregando Centralizar={false} tamanho="lg" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-background/50">
            <div className="shrink-0">
                <CabecalhoFuncionalidade
                    titulo="Quadro Kanban"
                    subtitulo="Gerencie e acompanhe o fluxo de tarefas do projeto em tempo real."
                    icone={FolderKanban}
                >
                    <div className="flex items-center gap-4">
                        {projetoAtivoId && podeCriar && (
                            <button
                                onClick={handleAbrirCriar}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.98] transition-all"
                            >
                                <Plus className="w-4 h-4" /> Nova Tarefa
                            </button>
                        )}
                        {carregando && tarefas.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 animate-pulse transition-all">
                                <Carregando Centralizar={false} tamanho="sm" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Sincronizando...</span>
                            </div>
                        )}
                    </div>
                </CabecalhoFuncionalidade>
            </div>

            {!carregandoProjetos && projetos.length === 0 ? (
                <KanbanVazioProjetos podeGerenciarProjetos={podeGerenciarProjetos} />
            ) : (
                <>
                    <div className="shrink-0 px-0.5">
                        <PainelFiltrosKanban filtros={filtros} aoFiltrar={handleFiltrar} />
                    </div>
                    <div className={`flex-1 min-h-0 transition-opacity duration-300 ${carregando && tarefas.length > 0 ? 'opacity-70' : 'opacity-100'}`}>
                        {carregando && tarefas.length === 0 ? (
                            <div className="h-full bg-card/10 border border-border/30 rounded-2xl flex items-center justify-center animate-in fade-in duration-500">
                                <div className="flex flex-col items-center gap-4">
                                    <Carregando Centralizar={false} tamanho="lg" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Buscando Tarefas</span>
                                </div>
                            </div>
                        ) : erro ? (
                            <div className="h-full flex items-center justify-center p-12">
                                <EstadoErro titulo="Erro no Kanban" mensagem={erro} />
                            </div>
                        ) : tarefas.length === 0 ? (
                            <div className="h-full bg-card/20 border border-border/50 rounded-2xl flex items-center justify-center">
                                {temFiltroAtivo ? (
                                    <EstadoVazio tipo="pesquisa" titulo="Nenhuma tarefa encontrada" descricao="Não há tarefas que correspondam aos filtros ou termo de busca aplicados." compacto={true} acao={{ rotulo: "Limpar todos os filtros", aoClicar: handleLimparFiltros }} />
                                ) : (
                                    <EstadoVazio titulo="Quadro Vazio" descricao="Ainda não há tarefas cadastradas para este projeto. Comece adicionando novas demandas no Backlog." />
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                                    <div className="h-full flex justify-between gap-6 overflow-x-auto pb-6 custom-scrollbar px-1">
                                        {COLUNAS_KANBAN.map((coluna, index) => (
                                            <ColunaDropZone 
                                                key={coluna} 
                                                id={coluna} 
                                                titulo={LABELS_COLUNAS[coluna]} 
                                                tarefas={tarefasPorStatus[coluna] || []} 
                                                aoApertarTarefa={setTarefaDetalhes}
                                                delayClass={`atraso-${index + 1}`}
                                            />
                                        ))}
                                        <DragOverlay dropAnimation={null}>
                                            {activeTarefa ? (
                                                <div className="rotate-[3deg] scale-[1.03] shadow-2xl opacity-90 transition-transform">
                                                    <CartaoTarefa tarefa={activeTarefa} />
                                                </div>
                                            ) : null}
                                        </DragOverlay>
                                    </div>
                                </DndContext>
                            </div>
                        )}
                    </div>
                </>
            )}

            <ModalDetalhesTarefa tarefa={tarefaDetalhes} aberto={!!tarefaDetalhes} aoFechar={handleFecharDetalhes} />
            <ModalCriarTarefa aberto={modalCriarAberto} aoFechar={handleFecharCriar} aoCriar={handleCriarTarefa} />
        </div>
    );
});

export default QuadroKanban;
