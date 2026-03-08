import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { PontoBurndown } from './usarDashboard';
import { GRAFICO_COR_PRIMARIA, GRAFICO_COR_PERIGO } from '../../utilitarios/constantes';
import { usarTema } from '../../contexto/ContextoTema';

interface GraficoBurndownProps {
    dados: PontoBurndown[];
}

/**
 * Gráfico de queima de tarefas/pontos da sprint ativa.
 */
export function GraficoBurndown({ dados }: GraficoBurndownProps) {
    const { temaReal } = usarTema();
    const eEscuro = temaReal === 'dark';

    if (dados.length === 0) return null;

    // Cores adaptativas para o gráfico
    const cores = {
        grade: eEscuro ? '#334155' : '#e2e8f0',
        texto: eEscuro ? '#94a3b8' : '#64748b',
        tooltipBg: eEscuro ? '#0f172a' : '#ffffff',
        tooltipBorda: eEscuro ? '#1e293b' : '#e2e8f0',
        tooltipTexto: eEscuro ? '#f8fafc' : '#0f172a',
    };

    return (
        <div className="h-72 w-full mt-4 min-h-[288px]">
            <ResponsiveContainer width="100%" height="100%" debounce={100} minWidth={0} aspect={2}>
                <LineChart data={dados} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={cores.grade} opacity={0.5} vertical={false} />

                    <XAxis
                        dataKey="dia"
                        stroke={cores.texto}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                    />

                    <YAxis
                        stroke={cores.texto}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value} pts`}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: cores.tooltipBg,
                            borderColor: cores.tooltipBorda,
                            borderRadius: '0.75rem',
                            color: cores.tooltipTexto,
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                        }}
                        itemStyle={{ fontSize: '13px' }}
                        labelStyle={{ fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}
                    />

                    <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        iconType="circle"
                    />

                    <Line
                        type="monotone"
                        name="Ideal (Planejado)"
                        dataKey="planejado"
                        stroke={GRAFICO_COR_PRIMARIA}
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        name="Atual (Restante)"
                        dataKey="realizado"
                        stroke={GRAFICO_COR_PERIGO}
                        strokeWidth={3}
                        activeDot={{ r: 6, strokeWidth: 0, fill: GRAFICO_COR_PERIGO }}
                    />

                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
