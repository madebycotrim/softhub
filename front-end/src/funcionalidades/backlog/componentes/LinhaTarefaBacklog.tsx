import { memo } from 'react';
import { ChevronRight, User } from 'lucide-react';
import { Emblema } from '@/compartilhado/componentes/Emblema';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { LABELS_PRIORIDADE, LABELS_STATUS } from '@/utilitarios/constantes';

interface LinhaTarefaBacklogProps {
    tarefa: any;
}

export const LinhaTarefaBacklog = memo(({ tarefa }: LinhaTarefaBacklogProps) => {
    return (
        <tr className="group hover:bg-white/[0.03] transition-all duration-300 cursor-pointer">
            <td className="px-8 py-6">
                <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold text-white/90 group-hover:text-primary transition-colors duration-300 tracking-tight">{tarefa.titulo}</span>
                    <span className="text-[11px] text-muted-foreground/40 line-clamp-1 max-w-xl font-medium leading-relaxed group-hover:text-muted-foreground/60 transition-colors">
                        {tarefa.descricao || "Sem detalhes adicionais fornecidos via IA ou manualmente."}
                    </span>
                </div>
            </td>
            <td className="px-4 py-6 text-center">
                <Emblema
                    texto={LABELS_PRIORIDADE[tarefa.prioridade as keyof typeof LABELS_PRIORIDADE]}
                    variante={
                        tarefa.prioridade === 'urgente' ? 'vermelho' :
                            tarefa.prioridade === 'alta' ? 'amarelo' :
                                tarefa.prioridade === 'media' ? 'azul' : 'cinza'
                    }
                    className="shadow-lg group-hover:scale-110 transition-transform duration-300"
                />
            </td>
            <td className="px-4 py-6 text-center">
                <Emblema
                    texto={LABELS_STATUS[tarefa.status as keyof typeof LABELS_STATUS]}
                    variante={
                        tarefa.status === 'concluida' ? 'verde' :
                        tarefa.status === 'in_progress' ? 'azul' :
                        tarefa.status === 'em_revisao' ? 'roxo' :
                        tarefa.status === 'todo' ? 'alerta' : 'cinza'
                    }
                    className="!bg-white/5 !text-white/60 !border-white/10 group-hover:!bg-white/10 transition-colors"
                />
            </td>
            <td className="px-4 py-6">
                <div className="flex items-center justify-center -space-x-2.5">
                    {tarefa.responsaveis && tarefa.responsaveis.length > 0 ? (
                        tarefa.responsaveis.map((resp: any) => (
                            <div key={resp.id} className="relative group/avatar">
                                <Avatar
                                    nome={resp.nome}
                                    fotoPerfil={resp.foto || null}
                                    tamanho="sm"
                                    className="ring-2 ring-slate-950 group-hover/avatar:ring-primary/50 group-hover/avatar:scale-110 transition-all z-0 hover:z-10"
                                />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-white/10 rounded text-[9px] font-bold text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                    {resp.nome}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center text-muted-foreground/20 group-hover:border-primary/20 group-hover:text-primary/30 transition-all">
                            <User size={12} />
                        </div>
                    )}
                </div>
            </td>
            <td className="px-8 py-6 text-right">
                <button className="p-3 bg-white/5 hover:bg-primary text-white/40 hover:text-white rounded-2xl transition-all duration-300 shadow-xl hover:shadow-primary/40 group-hover:translate-x-1">
                    <ChevronRight size={16} />
                </button>
            </td>
        </tr>
    );
});
