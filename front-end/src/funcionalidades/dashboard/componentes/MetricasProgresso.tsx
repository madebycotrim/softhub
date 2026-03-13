import { memo } from 'react';
import { ListChecks, CheckCircle2 } from 'lucide-react';

interface MetricasProps {
    metricas: {
        progressoGeral: number;
        tarefasConcluidas: number;
        totalTarefas: number;
    };
}

export const MetricasProgresso = memo(({ metricas }: MetricasProps) => {
    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 animar-entrada atraso-2">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <span className="p-2 bg-primary/5 text-primary rounded-2xl"><ListChecks className="w-4 h-4" /></span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progresso do Projeto</span>
                </div>
                <p className="text-2xl font-black text-foreground">{metricas.progressoGeral}%</p>
                <div className="w-full bg-accent/20 rounded-full h-1 mt-3">
                    <div className="bg-primary h-1 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${metricas.progressoGeral}%` }} />
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-emerald-500/20 transition-all">
                <div className="flex items-center justify-between mb-4">
                    <span className="p-2 bg-emerald-500/5 text-emerald-500 rounded-2xl"><CheckCircle2 className="w-4 h-4" /></span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Entregas</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black text-foreground">{metricas.tarefasConcluidas}</p>
                    <span className="text-xs text-muted-foreground font-medium">/ {metricas.totalTarefas}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium tracking-wide">Tarefas finalizadas no total</p>
            </div>
        </section>
    );
});
