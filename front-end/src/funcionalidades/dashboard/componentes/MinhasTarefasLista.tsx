import { memo } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

interface MinhasTarefasListaProps {
    minhasTarefas: any[];
}

export const MinhasTarefasLista = memo(({ minhasTarefas }: MinhasTarefasListaProps) => {
    return (
        <section className="bg-sidebar border border-sidebar-border/10 rounded-2xl overflow-hidden shadow-xl animar-entrada atraso-3">
            <div className="p-5 border-b border-sidebar-border/10 bg-sidebar-accent/5 flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-[0.2em]">Minhas Tarefas</h2>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-2xl font-bold">{minhasTarefas.length}</span>
            </div>
            <div className="p-2 space-y-1">
                {minhasTarefas.slice(0, 6).map(tarefa => (
                    <button key={tarefa.id} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-accent/20 transition-all text-left group">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{tarefa.titulo}</p>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    tarefa.prioridade === 'urgente' ? 'bg-destructive' : 
                                    tarefa.prioridade === 'alta' ? 'bg-orange-500' : 
                                    tarefa.prioridade === 'media' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{tarefa.prioridade}</p>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </button>
                ))}
                {minhasTarefas.length === 0 && (
                    <div className="p-8 text-center">
                        <p className="text-xs text-muted-foreground font-medium italic">Nenhuma tarefa pendente.</p>
                    </div>
                )}
            </div>
            <Link to="/app/kanban" className="block w-full p-4 text-[10px] text-center font-black uppercase tracking-widest text-muted-foreground hover:text-primary border-t border-border transition-colors">
                Ver Kanban Completo
            </Link>
        </section>
    );
});
