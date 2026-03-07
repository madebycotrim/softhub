import { Modal } from '../../compartilhado/componentes/Modal';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import { CORES_PRIORIDADE, LABELS_PRIORIDADE } from '../../utilitarios/constantes';
import type { Tarefa } from './usarKanban';
import { SecaoComentarios } from './SecaoComentarios';
import { SecaoHistorico } from './SecaoHistorico';
import { SecaoChecklist } from './SecaoChecklist';

interface ModalDetalhesTarefaProps {
    tarefa: Tarefa | null;
    aberto: boolean;
    aoFechar: () => void;
}

export function ModalDetalhesTarefa({ tarefa, aberto, aoFechar }: ModalDetalhesTarefaProps) {
    if (!tarefa) return null;

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Detalhes da Tarefa" largura="lg">
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold text-foreground leading-snug">
                        {tarefa.titulo}
                    </h2>
                    <Emblema
                        texto={LABELS_PRIORIDADE[tarefa.prioridade]}
                        variante={CORES_PRIORIDADE[tarefa.prioridade]}
                        className="shrink-0"
                    />
                </div>

                {tarefa.descricao ? (
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Descrição</h4>
                        <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">{tarefa.descricao}</p>
                    </div>
                ) : (
                    <div className="bg-muted border border-border rounded-xl p-4 text-center">
                        <p className="text-sm text-muted-foreground italic">Esta tarefa não possui uma descrição.</p>
                    </div>
                )}

                <div className="flex gap-4">
                    <div className="bg-card border border-border rounded-xl px-4 py-3 flex-1 flex flex-col items-center shadow-sm">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</h4>
                        <span className="text-xs font-medium text-foreground capitalize">
                            {tarefa.status.replace('_', ' ')}
                        </span>
                    </div>
                    {tarefa.pontos !== null && (
                        <div className="bg-card border border-border rounded-xl px-4 py-3 shrink-0 text-center flex flex-col items-center justify-center shadow-sm">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pontos</h4>
                            <span className="text-sm font-bold text-primary">{tarefa.pontos}</span>
                        </div>
                    )}
                </div>

                {/* WF 31 - Checklist da Tarefa */}
                <SecaoChecklist tarefaId={tarefa.id} />

                {/* WF 25 - Comentários da Tarefa */}
                <SecaoComentarios tarefaId={tarefa.id} />

                {/* WF 29 - Histórico da Tarefa */}
                <SecaoHistorico tarefaId={tarefa.id} />
            </div>
        </Modal>
    );
}
