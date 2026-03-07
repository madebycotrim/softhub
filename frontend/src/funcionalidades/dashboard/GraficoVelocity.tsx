import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { PontoVelocity } from './usarDashboard';
import { GRAFICO_COR_PRIMARIA } from '../../utilitarios/constantes';

interface GraficoVelocityProps {
    dados: PontoVelocity[];
}

/**
 * Gráfico histórico de velocity das sprints anteriores.
 */
export function GraficoVelocity({ dados }: GraficoVelocityProps) {
    if (dados.length === 0) return null;

    return (
        <div className="h-72 w-full mt-4 min-h-[288px]">
            <ResponsiveContainer width="100%" height="100%" debounce={100} minWidth={0} aspect={2.5}>
                <BarChart data={dados} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />

                    <XAxis
                        dataKey="sprint"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                    />

                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />

                    <Tooltip
                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#1e293b',
                            borderRadius: '0.75rem',
                            color: '#f8fafc'
                        }}
                        formatter={(value) => [`${value} pontos`, 'Entregue']}
                        labelStyle={{ display: 'none' }}
                    />

                    <Bar
                        dataKey="pontos"
                        fill={GRAFICO_COR_PRIMARIA}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                    />

                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
