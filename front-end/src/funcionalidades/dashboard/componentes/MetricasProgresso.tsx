import { memo } from 'react';
import { ListChecks, CheckCircle2, Target, Trophy } from 'lucide-react';

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
            {/* Card: Progresso do Projeto */}
            <div className="group bg-card hover:bg-muted/30 border border-border/60 p-6 rounded-[32px] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Target size={64} className="text-primary" />
                </div>
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <ListChecks className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progresso do Projeto</span>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-black text-foreground">{metricas.progressoGeral}%</div>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Concluído</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full mt-3 overflow-hidden">
                            <div 
                                className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                style={{ width: `${metricas.progressoGeral}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Card: Total de Entregas do Projeto */}
            <div className="group bg-card hover:bg-muted/30 border border-border/60 p-6 rounded-[32px] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Trophy size={64} className="text-emerald-500" />
                </div>
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entregas Totais</span>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-black text-foreground">{metricas.tarefasConcluidas}</div>
                            <span className="text-xs text-muted-foreground font-medium">/ {metricas.totalTarefas} tarefas</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-3 font-bold uppercase tracking-widest">
                            Volume acumulado no projeto
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
});
