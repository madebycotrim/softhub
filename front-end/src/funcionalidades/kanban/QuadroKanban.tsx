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
import { COLUNAS_KANBAN } from '../../utilitarios/constantes';
import type { ColunaKanban } from '../../utilitarios/constantes';
import { usarKanban } from './usarKanban';
import type { Tarefa, FiltrosKanban } from './usarKanban';
import { CartaoTarefa } from './CartaoTarefa';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { EstadoVazio } from '../../compartilhado/componentes/EstadoVazio';
import { ModalDetalhesTarefa } from './ModalDetalhesTarefa';
import { PainelFiltrosKanban } from './PainelFiltrosKanban';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';

/** Mapeamento amigável das colunas */
const LABELS_COLUNAS: Record<ColunaKanban, string> = {
    backlog: 'Backlog',
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
        <div className="flex flex-col flex-1 min-w-[300px] max-w-[350px] bg-card/80 backdrop-blur-md rounded-2xl border border-border shadow-sm overflow-hidden h-full">
            <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-card-foreground">
                    {titulo}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium text-secondary-foreground border border-border">
                    {tarefas.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 p-3 overflow-y-auto flex flex-col gap-3 transition-all duration-300 ${isOver ? 'bg-accent/50 ring-2 ring-inset ring-primary/50' : ''
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
export function QuadroKanban({ sprintId, projetoId }: { sprintId?: string, projetoId?: string }) {
    const [filtros, setFiltros] = useState<FiltrosKanban>({});
    const { tarefas, carregando, erro, moverCard } = usarKanban(sprintId, projetoId, filtros);
    const [activeTarefa, setActiveTarefa] = useState<Tarefa | null>(null);
    const [tarefaDetalhes, setTarefaDetalhes] = useState<Tarefa | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Exige mover 5px para ativar drag
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    if (carregando) return <Carregando />;
    if (erro) return <p className="text-destructive text-center py-8">{erro}</p>;
    if (tarefas.length === 0) return <EstadoVazio titulo="Nenhuma tarefa encontrada." descricao="Crie tarefas ou selecione uma sprint para ver o quadro." />;

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const tarefa = tarefas.find(t => t.id === active.id);
        if (tarefa) setActiveTarefa(tarefa);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTarefa(null);

        // Se n dropar numa area valida, cancela
        if (!over) return;

        const tarefaId = active.id as string;
        const colunaDestino = over.id as ColunaKanban;
        const tarefa = tarefas.find(t => t.id === tarefaId);

        // So movemos se ele dropar em uma coluna diferente
        if (tarefa && tarefa.status !== colunaDestino) {
            moverCard(tarefaId, colunaDestino);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 pb-0 animate-in fade-in duration-500">
            <CabecalhoFuncionalidade
                titulo="Quadro Kanban"
                subtitulo="Gerencie e acompanhe o fluxo de tarefas do projeto."
                icone={FolderKanban}
            />

            <PainelFiltrosKanban filtros={filtros} aoFiltrar={setFiltros} />

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
                            tarefas={tarefas.filter(t => t.status === coluna)}
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
        </div>
    );
}
