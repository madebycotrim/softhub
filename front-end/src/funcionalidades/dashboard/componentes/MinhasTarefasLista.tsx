import { memo } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Briefcase, ListTodo } from 'lucide-react';

interface MinhasTarefasListaProps {
    minhasTarefas: any[];
}

export const MinhasTarefasLista = memo(({ minhasTarefas }: MinhasTarefasListaProps) => {
    return (
        <section className="group card-glass card-glass-hover overflow-hidden animar-entrada atraso-3 relative">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <ListTodo size={120} className="text-primary" />
            </div>

            <div className="p-3 space-y-2 relative z-10 min-h-[220px]">
                {minhasTarefas.slice(0, 5).map(tarefa => (
                    <Link 
                        key={tarefa.id} 
                        to={`/app/kanban?tarefa=${tarefa.id}`}
                        className="w-full flex items-center justify-between p-4 rounded-[28px] hover:bg-primary/5 border border-transparent hover:border-border/30 transition-all text-left group/item"
                    >

                        <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                {tarefa.projeto_nome}
                            </span>
                            <p className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors truncate">
                                {tarefa.titulo}
                            </p>
                            <div className="flex items-center gap-2">
                                <div className={`px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                                    tarefa.prioridade === 'urgente' ? 'bg-destructive/10 text-destructive' : 
                                    tarefa.prioridade === 'alta' ? 'bg-orange-500/10 text-orange-500' : 
                                    tarefa.prioridade === 'media' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                    <span className={`w-1 h-1 rounded-full ${
                                        tarefa.prioridade === 'urgente' ? 'bg-destructive' : 
                                        tarefa.prioridade === 'alta' ? 'bg-orange-500' : 
                                        tarefa.prioridade === 'media' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} />
                                    <p className="text-[8px] font-black uppercase tracking-widest leading-none">{tarefa.prioridade}</p>
                                </div>
                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                    {tarefa.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary/0 group-hover/item:bg-primary/5 flex items-center justify-center transition-all">
                                <ChevronRight size={16} className="text-muted-foreground/30 group-hover/item:text-primary group-hover/item:translate-x-0.5 transition-all" />
                            </div>
                        </div>
                    </Link>
                ))}

                {minhasTarefas.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-muted/10 flex items-center justify-center text-muted-foreground/20 border border-border/10 rotate-3 group-hover:rotate-0 transition-transform duration-700">
                            <ListTodo size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-foreground uppercase tracking-widest">Nenhuma tarefa pendente</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">Você está em dia com suas entregas. <br/> Aproveite para revisar o backlog.</p>
                        </div>
                    </div>
                )}
            </div>


            <Link 
                to="/app/kanban" 
                className="block w-full p-5 text-[10px] text-center font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary border-t border-border/40 hover:bg-primary/5 transition-all relative z-10"
            >
                Ver Kanban Completo
            </Link>
        </section>
    );
});

