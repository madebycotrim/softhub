import { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { COLUNAS_KANBAN } from '@/utilitarios/constantes';
import type { ColunaKanban } from '@/utilitarios/constantes';
import { usarKanban } from '@/funcionalidades/kanban/hooks/usarKanban';
import type { Tarefa, FiltrosKanban } from '@/funcionalidades/kanban/hooks/usarKanban';
import { CartaoTarefa } from './CartaoTarefa';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { ModalDetalhesTarefa } from './ModalDetalhesTarefa';
import { PainelFiltrosKanban } from './PainelFiltrosKanban';
import { ModalCriarTarefa } from '@/funcionalidades/backlog/componentes/ModalCriarTarefa';
import { usarBacklog } from '@/funcionalidades/backlog/hooks/usarBacklog';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { FolderKanban, Circle, Zap, Search, CheckCircle2, Plus, Info } from 'lucide-react';
import { useMemo } from 'react';

/** Mapeamento amigável das colunas */
const LABELS_COLUNAS: Record<string, string> = {
    todo: 'A Fazer',
    in_progress: 'Em Andamento',
    em_revisao: 'Em Revisão',
    concluida: 'Concluído'
};

const ICONES_COLUNAS: Record<string, any> = {
    todo: Circle,
    in_progress: Zap,
    em_revisao: Search,
    concluida: CheckCircle2
};

/** Coluna Drop Zone interna */
function ColunaDropZone({ id, titulo, tarefas, aoApertarTarefa }: { id: ColunaKanban; titulo: string; tarefas: Tarefa[], aoApertarTarefa: (t: Tarefa) => void }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: {
            type: 'Column',
            coluna: id
        }
    });

    const Icone = ICONES_COLUNAS[id];

    return (
        <div className="flex flex-col flex-1 min-w-[320px] max-w-[360px] bg-card/60 dark:bg-card/20 backdrop-blur-3xl rounded-b-2xl border border-border/50 shadow-sm overflow-hidden h-full transition-all duration-500 group/column">
            <div className="p-5 border-b border-border/50 bg-muted/30 flex items-center justify-between shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/column:opacity-100 transition-opacity duration-700" />
                <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2.5 relative z-10">
                    <div className="w-8 h-8 rounded-2xl bg-background border border-border/60 flex items-center justify-center text-primary/60 shadow-sm">
                        <Icone size={14} />
                    </div>
                    {titulo}
                </h3>
                <span className="px-3 py-1 rounded-2xl bg-primary/10 text-[10px] font-black text-primary border border-primary/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                    {tarefas.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 p-4 overflow-y-auto flex flex-col gap-4 scrollbar-none transition-all duration-300 ${isOver ? 'bg-primary/5 ring-2 ring-inset ring-primary/30 rounded-2xl' : ''
                    }`}
            >
                {tarefas.map(tarefa => (
                    <CartaoTarefa key={tarefa.id} tarefa={tarefa} aoClicar={aoApertarTarefa} />
                ))}
            </div>
        </div>
    );
}

/**
 * O Quadro Kanban que exibe as colunas com Drag and Drop funcional.
 */
export function QuadroKanban({ projetoId = 'p1' }: { projetoId?: string }) {
    const [filtros, setFiltros] = useState<FiltrosKanban>({});
    const { tarefas, carregando, erro, moverCard } = usarKanban(projetoId, filtros);
    const [activeTarefa, setActiveTarefa] = useState<Tarefa | null>(null);
    const [tarefaDetalhes, setTarefaDetalhes] = useState<Tarefa | null>(null);
    const [modalCriarAberto, setModalCriarAberto] = useState(false);

    const podeMover = usarPermissaoAcesso('tarefas:mover');
    const podeCriar = usarPermissaoAcesso('tarefas:criar');

    const { criarTarefa } = usarBacklog(projetoId);

    // Agrupamento otimizado de tarefas por status
    const tarefasPorStatus = useMemo(() => {
        const agrupado: Record<string, Tarefa[]> = {
            todo: [],
            in_progress: [],
            em_revisao: [],
            concluida: []
        };
        tarefas.forEach((t: Tarefa) => {
            if (agrupado[t.status]) agrupado[t.status].push(t);
        });
        return agrupado;
    }, [tarefas]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Exige mover 5px para ativar drag
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const temFiltroAtivo = !!(filtros.busca || filtros.prioridades?.length || filtros.responsavelId);

    const handleDragStart = (event: DragStartEvent) => {
        if (!podeMover) return;
        const { active } = event;
        const tarefa = tarefas.find((t: Tarefa) => t.id === active.id);
        if (tarefa) setActiveTarefa(tarefa);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        if (!podeMover) return;
        const { active, over } = event;
        setActiveTarefa(null);

        if (!over) return;

        const tarefaId = active.id as string;
        const colunaDestino = over.id as ColunaKanban;
        const tarefa = tarefas.find((t: Tarefa) => t.id === tarefaId);

        if (tarefa && tarefa.status !== (colunaDestino as any)) {
            moverCard(tarefaId, colunaDestino as any);
        }
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-background/50">
            <div className="shrink-0">
                <CabecalhoFuncionalidade
                    titulo="Quadro Kanban"
                    subtitulo="Gerencie e acompanhe o fluxo de tarefas do projeto em tempo real."
                    icone={FolderKanban}
                >
                    <div className="flex items-center gap-4">
                        {podeCriar && (
                            <button
                                onClick={() => setModalCriarAberto(true)}
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

            <div className="shrink-0 px-0.5">
                <PainelFiltrosKanban filtros={filtros} aoFiltrar={setFiltros} />
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
                            <EstadoVazio
                                tipo="pesquisa"
                                titulo="Nenhuma tarefa encontrada"
                                descricao="Não há tarefas que correspondam aos filtros ou termo de busca aplicados."
                                compacto={true}
                                acao={{
                                    rotulo: "Limpar todos os filtros",
                                    aoClicar: () => setFiltros({})
                                }}
                            />
                        ) : (
                            <EstadoVazio
                                titulo="Quadro Vazio"
                                descricao="Ainda não há tarefas cadastradas para este projeto. Comece adicionando novas demandas no Backlog."
                            />
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCorners}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                        <div className="h-full flex justify-between gap-6 overflow-x-auto custom-scrollbar scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/40 hover:scrollbar-thumb-border/60">
                                {COLUNAS_KANBAN.map(coluna => (
                                    <ColunaDropZone
                                        key={coluna}
                                        id={coluna as any}
                                        titulo={LABELS_COLUNAS[coluna]}
                                        tarefas={tarefasPorStatus[coluna] || []}
                                        aoApertarTarefa={setTarefaDetalhes}
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

    

            <ModalDetalhesTarefa
                tarefa={tarefaDetalhes}
                aberto={!!tarefaDetalhes}
                aoFechar={() => setTarefaDetalhes(null)}
            />

            <ModalCriarTarefa
                aberto={modalCriarAberto}
                aoFechar={() => setModalCriarAberto(false)}
                aoCriar={async (dados) => {
                    await criarTarefa({ ...dados, status: 'todo' });
                }}
            />
        </div>
    );
}
