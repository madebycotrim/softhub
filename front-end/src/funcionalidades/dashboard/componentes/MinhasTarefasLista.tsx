import { memo } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Briefcase, ListTodo } from 'lucide-react';

interface MinhasTarefasListaProps {
    minhasTarefas: any[];
}

export const MinhasTarefasLista = memo(({ minhasTarefas }: MinhasTarefasListaProps) => {
    return (
        <section className="group bg-card hover:bg-muted/10 border border-border/60 rounded-[32px] overflow-hidden shadow-xl transition-all duration-500 animar-entrada atraso-3 relative">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <ListTodo size={120} className="text-primary" />
            </div>

            <div className="p-6 border-b border-border/40 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">Minhas Tarefas</h2>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black shadow-sm border border-primary/10">
                    {minhasTarefas.length} TAREFAS
                </span>
            </div>

            <div className="p-3 space-y-2 relative z-10 min-h-[200px]">
                {minhasTarefas.slice(0, 5).map(tarefa => (
                    <button 
                        key={tarefa.id} 
                        className="w-full flex items-center justify-between p-4 rounded-[24px] hover:bg-accent/40 hover:shadow-sm border border-transparent hover:border-border/40 transition-all text-left group/item"
                    >
                        <div className="flex flex-col gap-1.5">
                            <p className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors line-clamp-1">{tarefa.titulo}</p>
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
                                    <p className="text-[8px] font-black uppercase tracking-widest">{tarefa.prioridade}</p>
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground/20 group-hover/item:text-primary group-hover/item:translate-x-1 transition-all" />
                    </button>
                ))}

                {minhasTarefas.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground/40">
                            <ListTodo className="w-6 h-6" />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider italic">Nenhuma tarefa pendente para hoje.</p>
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

