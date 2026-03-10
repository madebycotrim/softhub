import { Avatar } from '../../compartilhado/componentes/Avatar';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import { CORES_PRIORIDADE, LABELS_PRIORIDADE } from '../../utilitarios/constantes';
import type { Tarefa } from './usarKanban';
import { useDraggable } from '@dnd-kit/core';
import { usarPermissaoAcesso } from '../../compartilhado/hooks/usarPermissao';
import { usarChecklist } from './usarChecklist';
import { CheckCircle2 } from 'lucide-react';

interface CartaoTarefaProps {
    tarefa: Tarefa;
    aoClicar?: (tarefa: Tarefa) => void;
}

/**
 * Representa uma única tarefa visualmente dentro da coluna.
 */
export function CartaoTarefa({ tarefa, aoClicar }: CartaoTarefaProps) {
    const isUrgente = tarefa.prioridade === 'urgente';
    const { totalConcluidos, totalItens } = usarChecklist(tarefa.id);
    const podeMover = usarPermissaoAcesso('tarefas:mover');

    // Configuração DnD Kit
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: tarefa.id,
        data: {
            type: 'Task',
            tarefa,
        },
        disabled: !podeMover
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
        bg-card p-3 rounded-2xl border flex flex-col gap-3 select-none transition-all duration-200
        ${podeMover ? 'cursor-grab active:cursor-grabbing hover:border-border' : 'cursor-default opacity-80'}
        ${isDragging ? 'opacity-50 ring-1 ring-primary z-50' : ''}
        ${isUrgente ? 'border-destructive/20 bg-destructive/5' : 'border-border/50'}
      `}
            onClick={() => aoClicar?.(tarefa)}
        >
            <div className="flex justify-between items-start gap-2">
                <h4 className="text-sm font-medium text-card-foreground leading-tight line-clamp-2">
                    {tarefa.titulo}
                </h4>
                <Emblema
                    texto={LABELS_PRIORIDADE[tarefa.prioridade]}
                    variante={CORES_PRIORIDADE[tarefa.prioridade]}
                    className="shrink-0"
                />
            </div>

            <div className="flex items-center justify-between mt-1 text-muted-foreground">
                <div className="flex items-center gap-3 text-xs">
                    {tarefa.pontos !== null && (
                        <span className="flex items-center justify-center w-5 h-5 bg-primary/10 rounded-full font-medium text-primary border border-primary/20">
                            {tarefa.pontos}
                        </span>
                    )}

                    {/* WF 31 - Indicador de Checklist */}
                    {totalItens > 0 && (
                        <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-2xl border ${totalConcluidos === totalItens ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="font-mono">{totalConcluidos}/{totalItens}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {tarefa.responsaveis.map((resp) => (
                        <div key={resp.id} className="flex flex-col items-center bg-muted/40 rounded-2xl p-1 border border-border/10">
                            <Avatar
                                nome={resp.nome}
                                fotoPerfil={resp.foto}
                                tamanho="sm"
                            />
                        </div>
                    ))}
                    {tarefa.responsaveis.length === 0 && (
                        <div className="w-6 h-6 rounded-full border border-dashed border-muted-foreground flex items-center justify-center bg-muted">
                            <span className="sr-only">Sem responsável</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
