import { Avatar } from '@/compartilhado/componentes/Avatar';
import { Emblema } from '@/compartilhado/componentes/Emblema';
import { CORES_PRIORIDADE, LABELS_PRIORIDADE } from '@/utilitarios/constantes';
import type { Tarefa } from '@/funcionalidades/kanban/hooks/usarKanban';
import { useDraggable } from '@dnd-kit/core';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { usarChecklist } from '@/funcionalidades/kanban/hooks/usarChecklist';
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
        bg-white/[0.04] p-4 rounded-[24px] border border-white/5 flex flex-col gap-4 select-none transition-all duration-300 backdrop-blur-sm
        ${podeMover ? 'cursor-grab active:cursor-grabbing hover:bg-white/[0.08] hover:border-white/10 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1' : 'cursor-default opacity-80'}
        ${isDragging ? 'opacity-30 scale-95 ring-2 ring-primary/40 z-50' : ''}
        ${isUrgente ? 'border-rose-500/30 bg-rose-500/[0.04] shadow-[0_0_20px_rgba(244,63,94,0.1)]' : ''}
      `}
            onClick={() => aoClicar?.(tarefa)}
        >
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start gap-3">
                    <h4 className="text-[13px] font-bold text-white/90 leading-relaxed tracking-tight group-hover:text-primary transition-colors">
                        {tarefa.titulo}
                    </h4>
                    <Emblema
                        texto={LABELS_PRIORIDADE[tarefa.prioridade]}
                        variante={CORES_PRIORIDADE[tarefa.prioridade]}
                        className={`shrink-0 shadow-lg ${isUrgente ? 'animate-pulse' : ''}`}
                    />
                </div>

                {tarefa.descricao && (
                    <p className="text-[10px] text-muted-foreground/40 font-medium line-clamp-2 leading-relaxed">
                        {tarefa.descricao}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                    {tarefa.pontos !== null && (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary/10 rounded-lg text-[10px] font-black text-primary border border-primary/20">
                            {tarefa.pontos}
                        </span>
                    )}

                    {/* WF 31 - Indicador de Checklist */}
                    {totalItens > 0 && (
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-colors ${totalConcluidos === totalItens ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-muted-foreground/40 border-white/5'}`}>
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="text-[10px] font-black tracking-tighter">{totalConcluidos}/{totalItens}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center -space-x-2">
                    {tarefa.responsaveis.map((resp) => (
                        <div key={resp.id} className="relative group/avatar">
                            <Avatar
                                nome={resp.nome}
                                fotoPerfil={resp.foto || null}
                                tamanho="sm"
                                className="ring-2 ring-slate-900 shadow-xl group-hover/avatar:ring-primary/50 group-hover/avatar:scale-110 transition-all z-0 hover:z-10"
                            />
                        </div>
                    ))}
                    {tarefa.responsaveis.length === 0 && (
                        <div className="w-7 h-7 rounded-full border border-dashed border-white/10 flex items-center justify-center bg-white/[0.02] text-muted-foreground/20">
                            <span className="sr-only">Sem responsável</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
