import { memo } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { Target, Award } from 'lucide-react';

interface RadarCompetenciasProps {
    dados: Array<{ area: string, nota: number, entregas: number }>;
}

export const RadarCompetencias = memo(({ dados }: RadarCompetenciasProps) => {
    // Se não houver dados significativos, não exibe
    const temDados = dados?.some(d => d.nota > 0);

    if (!temDados) return (
        <div className="h-full flex flex-col items-center justify-center text-center py-12 px-6 bg-primary/5 border border-dashed border-primary/20 rounded-[40px] animar-entrada">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary/30 mb-4">
                <Target size={28} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Perfil Tático em Formação</p>
            <p className="text-[11px] text-muted-foreground mt-2 max-w-[180px] leading-relaxed opacity-60">
                O radar de competências é alimentado pelas suas entregas com feedback.
            </p>
        </div>
    );

    // Ajusta o formato para o recharts (limita a 5 para não poluir)
    const dataFormatted = dados.slice(0, 6).map(d => ({
        subject: d.area,
        A: d.nota,
        fullMark: 5,
        entregas: d.entregas
    }));

    return (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl">
                        <Award size={16} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Expertise Ativa</h4>
                        <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest opacity-40 leading-none mt-0.5">Mapeamento de Hardskills</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={dataFormatted}>
                        <PolarGrid stroke="currentColor" opacity={0.1} />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.5, fontWeight: '900' }} 
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))', 
                                borderRadius: '16px',
                                fontSize: '11px',
                                fontWeight: '900',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Radar
                            name="Proficiência"
                            dataKey="A"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.4}
                            animationDuration={1500}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                {dados.slice(0, 4).map(d => (
                    <div key={d.area} className="p-3 bg-card/60 border border-border/40 rounded-2xl group hover:border-primary/30 transition-all">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary/60 transition-colors truncate">{d.area}</p>
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-sm font-black text-foreground drop-shadow-sm">{Math.round(d.nota * 10) / 10}</span>
                            <span className="text-[8px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/10">
                                {d.entregas} QTS
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

