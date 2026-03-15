import { memo, useMemo } from 'react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Area,
    AreaChart,
    ReferenceLine
} from 'recharts';
import { Flame, Info } from 'lucide-react';
import { usarBurndown, DadoBurndown } from '../hooks/usarDashboard';
import { Carregando } from '@/compartilhado/componentes/Carregando';

interface GraficoBurndownProps {
    projetoId?: string;
}

export const GraficoBurndown = memo(({ projetoId }: GraficoBurndownProps) => {
    const { burndown, carregando } = usarBurndown(projetoId);

    // Encontra o index do dia de hoje para a linha de referência
    const hojeIndex = useMemo(() => {
        const hoje = new Date();
        const d = hoje.getDate().toString().padStart(2, '0');
        const m = (hoje.getMonth() + 1).toString().padStart(2, '0');
        const hojeBr = `${d}/${m}`;
        const hojeUs = `${m}/${d}`;
        
        return burndown.findIndex(p => p.dia === hojeBr || p.dia === hojeUs);
    }, [burndown]);

    if (carregando) return (
        <div className="h-[300px] flex items-center justify-center bg-card/30 border border-border rounded-3xl">
            <Carregando tamanho="md" />
        </div>
    );

    if (burndown.length === 0) return null;

    return (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative group">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                        <Flame size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">Evolução das Entregas</h4>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Progresso nos últimos 15 dias</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Real</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-border" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Ideal</span>
                    </div>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={burndown}>
                        <defs>
                            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                        <XAxis 
                            dataKey="dia" 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10}
                            tick={(props: any) => {
                                const { x, y, payload } = props;
                                const hoje = new Date();
                                const d = hoje.getDate().toString().padStart(2, '0');
                                const m = (hoje.getMonth() + 1).toString().padStart(2, '0');
                                const hojeBr = `${d}/${m}`;
                                const hojeUs = `${m}/${d}`;
                                
                                const ehHoje = payload.value === hojeBr || payload.value === hojeUs;

                                return (
                                    <g transform={`translate(${x},${y})`}>
                                        <text
                                            x={0}
                                            y={0}
                                            dy={16}
                                            textAnchor="middle"
                                            fill={ehHoje ? 'hsl(var(--primary))' : 'currentColor'}
                                            style={{ 
                                                fontSize: ehHoje ? '11px' : '10px', 
                                                fontWeight: ehHoje ? '900' : 'black',
                                                opacity: ehHoje ? 1 : 0.4
                                            }}
                                        >
                                            {ehHoje ? 'HOJE' : payload.value}
                                        </text>
                                        {ehHoje && (
                                            <circle cx={0} cy={24} r={3} fill="hsl(var(--primary))" className="animate-pulse shadow-lg" />
                                        )}
                                    </g>
                                );
                            }}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5, fontWeight: 'black' }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))', 
                                borderRadius: '16px',
                                fontSize: '11px',
                                fontWeight: '900',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}
                            itemStyle={{ padding: '2px 0' }}
                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        
                        {hojeIndex !== -1 && (
                            <ReferenceLine 
                                x={burndown[hojeIndex].dia} 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                strokeDasharray="3 3"
                                label={{ 
                                    value: 'TEMPO REAL', 
                                    position: 'top', 
                                    fill: 'hsl(var(--primary))', 
                                    fontSize: 9, 
                                    fontWeight: 900,
                                    letterSpacing: '0.1em'
                                }}
                            />
                        )}

                        <Area 
                            type="monotone" 
                            dataKey="real" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorReal)" 
                            animationDuration={1500}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="ideal" 
                            stroke="#475569" 
                            strokeWidth={2} 
                            strokeDasharray="5 5" 
                            dot={false}
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-start gap-2 p-3 bg-muted/30 rounded-xl border border-border/50">
                <Info size={14} className="text-muted-foreground mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    A linha <b>Ideal</b> mostra o ritmo esperado para terminar tudo. <br/> 
                    Se a linha <b>Real</b> estiver abaixo da pontilhada, você está adiantado!
                </p>
            </div>
        </div>
    );
});
