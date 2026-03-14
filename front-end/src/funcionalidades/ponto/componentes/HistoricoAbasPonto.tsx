import { memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isSameDay, startOfWeek, isToday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarraBusca } from '@/compartilhado/componentes/BarraBusca';
import { DayCard } from './DayCard';
import { ListaJustificativas } from './ListaJustificativas';
import type { JustificativaPonto } from '@/funcionalidades/ponto/hooks/usarJustificativa';
import type { RegistroPonto } from '@/funcionalidades/ponto/hooks/usarPonto';

interface HistoricoAbasPontoProps {
    abaAtiva: 'registro' | 'justificativas';
    busca: string;
    onMudarBusca: (v: string) => void;
    semanaSelecionada: number;
    semanasDisponiveis: number[];
    onSemanaAnterior: () => void;
    onSemanaProxima: () => void;
    registrosAgrupados: { dia: Date, registros: any[] }[];
    justificativas: JustificativaPonto[];
    onEditarJustificativa: (j: JustificativaPonto) => void;
    onExcluirJustificativa: (id: string) => void;
}

export const HistoricoAbasPonto = memo(({
    abaAtiva,
    busca,
    onMudarBusca,
    semanaSelecionada,
    semanasDisponiveis,
    onSemanaAnterior,
    onSemanaProxima,
    registrosAgrupados,
    justificativas,
    onEditarJustificativa,
    onExcluirJustificativa
}: HistoricoAbasPontoProps) => {
    const indiceSemanaAtual = semanasDisponiveis.indexOf(semanaSelecionada);

    const justificativasFiltradas = useMemo(() => {
        return justificativas.filter(j => 
            j.motivo.toLowerCase().includes(busca.toLowerCase()) || 
            j.tipo.toLowerCase().includes(busca.toLowerCase())
        );
    }, [justificativas, busca]);

    return (
        <div className="card-glass p-8 flex flex-col card-glass-hover max-h-[540px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6 shrink-0">
                <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Linha do Tempo</h3>
                    <p className="text-[24px] font-black text-slate-900 tracking-tight">
                        {abaAtiva === 'registro' ? 'Atividade da Semana' : 'Justificativas Enviadas'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    {abaAtiva === 'registro' && semanasDisponiveis.length > 1 && (
                        <div className="flex items-center gap-2 bg-slate-950/[0.03] p-1.5 rounded-2xl border border-slate-950/5 backdrop-blur-sm">
                            <button 
                                onClick={onSemanaAnterior}
                                disabled={indiceSemanaAtual <= 0}
                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed text-slate-600"
                            >
                                <ChevronLeft size={18} strokeWidth={2.5} />
                            </button>
                            <div className="px-3 min-w-[120px] text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                                    {isSameDay(new Date(semanaSelecionada), startOfWeek(new Date(), { weekStartsOn: 1 })) 
                                        ? 'Esta Semana' 
                                        : format(new Date(semanaSelecionada), "'Semana de' dd/MM", { locale: ptBR })}
                                </span>
                            </div>
                            <button 
                                onClick={onSemanaProxima}
                                disabled={indiceSemanaAtual >= semanasDisponiveis.length - 1}
                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed text-slate-600"
                            >
                                <ChevronRight size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}

                    <div className="relative w-full sm:w-56">
                        <BarraBusca
                            valor={busca}
                            aoMudar={onMudarBusca}
                            placeholder="Buscar registros..."
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none pr-1">
                {abaAtiva === 'registro' ? (
                    <div className="grid grid-cols-5 gap-3 w-full">
                        {registrosAgrupados.map(({ dia, registros }) => (
                            <DayCard
                                key={dia.toISOString()}
                                dia={dia}
                                registros={registros}
                                hoje={isToday(dia)}
                            />
                        ))}
                    </div>
                ) : (
                    <ListaJustificativas
                        justificativas={justificativasFiltradas}
                        aoEditar={onEditarJustificativa}
                        aoExcluir={onExcluirJustificativa}
                    />
                )}
            </div>
        </div>
    );
});
