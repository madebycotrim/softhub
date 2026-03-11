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
import { FolderKanban } from 'lucide-react';
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
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';

/** Mapeamento amigável das colunas */
const LABELS_COLUNAS: Record<ColunaKanban, string> = {
    a_fazer: 'A Fazer',
    em_andamento: 'Em Andamento',
    em_revisao: 'Em Revisão',
    concluido: 'Concluído'
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

    return (
        <div className="flex flex-col flex-1 min-w-[300px] max-w-[350px] bg-white/[0.03] backdrop-blur-xl rounded-[32px] border border-white/10 shadow-2xl shadow-black/20 overflow-hidden h-full transition-all duration-500">
            <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
                <h3 className="font-black text-[12px] uppercase tracking-[0.2em] text-white/50">
                    {titulo}
                </h3>
                <span className="px-3 py-1 rounded-xl bg-primary/10 text-[10px] font-black text-primary border border-primary/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                    {tarefas.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 p-4 overflow-y-auto flex flex-col gap-4 scrollbar-none transition-all duration-300 ${isOver ? 'bg-primary/5 ring-2 ring-inset ring-primary/20' : ''
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

    const podeMover = usarPermissaoAcesso('tarefas:mover');

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
        <div className="flex flex-col h-full space-y-6">
            <CabecalhoFuncionalidade
                titulo="Quadro Kanban"
                subtitulo="Gerencie e acompanhe o fluxo de tarefas do projeto."
                icone={FolderKanban}
            >
                <div className="flex items-center gap-4">
                    {carregando && tarefas.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 animate-pulse transition-all">
                            <Carregando Centralizar={false} tamanho="sm" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Sincronizando...</span>
                        </div>
                    )}
                </div>
            </CabecalhoFuncionalidade>

            <PainelFiltrosKanban filtros={filtros} aoFiltrar={setFiltros} />

            <div className={`flex-1 min-h-0 transition-opacity duration-300 ${carregando && tarefas.length > 0 ? 'opacity-70' : 'opacity-100'}`}>
                {carregando && tarefas.length === 0 ? (
                    <div className="h-full bg-card/10 border border-border/30 rounded-3xl flex items-center justify-center animate-in fade-in duration-500">
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
                    <div className="h-full bg-card/20 border border-border/50 rounded-3xl flex items-center justify-center">
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex gap-4 h-full xl:justify-start overflow-x-auto pb-4 custom-scrollbar items-start">
                            {COLUNAS_KANBAN.map(coluna => (
                                <ColunaDropZone
                                    key={coluna}
                                    id={coluna}
                                    titulo={LABELS_COLUNAS[coluna]}
                                    tarefas={tarefas.filter((t: Tarefa) => t.status === (coluna as any))}
                                    aoApertarTarefa={setTarefaDetalhes}
                                />
                            ))}

                            <DragOverlay>
                                {activeTarefa ? <CartaoTarefa tarefa={activeTarefa} /> : null}
                            </DragOverlay>
                        </div>

                        <ModalDetalhesTarefa
                            tarefa={tarefaDetalhes}
                            aberto={!!tarefaDetalhes}
                            aoFechar={() => setTarefaDetalhes(null)}
                        />
                    </DndContext>
                )}
            </div>
        </div>
    );
}
