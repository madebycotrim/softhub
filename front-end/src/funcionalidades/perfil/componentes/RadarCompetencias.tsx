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
    const temDados = dados.some(d => d.nota > 0);

    if (!temDados) return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px]">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
                <Target size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Radar em Formação</p>
            <p className="text-[11px] text-slate-400 mt-1 italic">Conclua tarefas com feedback para mapear suas competências.</p>
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
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
                        <Award size={14} />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Mapa de Competências</h4>
                </div>
            </div>

            <div className="flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dataFormatted}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} 
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                        />
                        <Radar
                            name="Nível de Aprendizado"
                            dataKey="A"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.4}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                {dados.slice(0, 4).map(d => (
                    <div key={d.area} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 truncate">{d.area}</p>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-slate-700">{Math.round(d.nota * 10) / 10}</span>
                            <span className="text-[8px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-100">
                                {d.entregas} entregas
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
