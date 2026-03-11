import { useState } from 'react';
import { 
    FileText, 
    Users, 
    Download, 
    BarChart4, 
    User, 
    Network
} from 'lucide-react';
import { usarRelatorios } from '../hooks/usarRelatorios';
import type { RelatorioFrequenciaMembro } from '../hooks/usarRelatorios';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { BarraBusca } from '../../compartilhado/componentes/BarraBusca';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatarDataHora } from '../../utilitarios/formatadores';

const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PaginaRelatorios() {
    const { 
        equipesRelatorio, 
        frequenciaGeral, 
        frequenciaMembros, 
        carregando, 
        erro 
    } = usarRelatorios();

    const [abaAtiva, setAbaAtiva] = useState<'geral' | 'equipes' | 'membros'>('geral');
    const [busca, setBusca] = useState('');

    const membrosFiltrados = frequenciaMembros.filter(m => 
        m.nome.toLowerCase().includes(busca.toLowerCase()) || 
        m.email.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-700 pb-20">
                <CabecalhoFuncionalidade 
                    titulo="Relatórios Completos"
                    subtitulo="Análise estratégica de estrutura, frequência e engajamento."
                    icone={FileText}
                >
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Download className="w-4 h-4" /> Exportar / Imprimir
                    </button>
                </CabecalhoFuncionalidade>

                {carregando && frequenciaMembros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 bg-card border border-border rounded-3xl">
                        <Carregando Centralizar={false} tamanho="lg" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Processando Dados Estratégicos</span>
                    </div>
                ) : (
                    <>

                {/* Tabs / Navegação Interna */}
                <div className="flex p-1 bg-muted/20 border border-border/10 rounded-3xl w-fit">
                    {[
                        { id: 'geral', label: 'Frequência Geral', icone: BarChart4 },
                        { id: 'equipes', label: 'Equipes (Estrutura)', icone: Users },
                        { id: 'membros', label: 'Por Membro', icone: User },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setAbaAtiva(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                abaAtiva === tab.id 
                                ? 'bg-card text-foreground shadow-xl' 
                                : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/30'
                            }`}
                        >
                            <tab.icone size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                {erro && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold animate-in shake">
                        {erro}
                    </div>
                )}

                {/* ── SEÇÃO: GERAL ── */}
                {abaAtiva === 'geral' && frequenciaGeral && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Gráfico de Tendência */}
                        <div className="lg:col-span-8 bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-8 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-8">Tendência de Presença (30 dias)</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={frequenciaGeral.tendencia}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis 
                                            dataKey="data" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            tickFormatter={(val) => val.split('-')[2]} 
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                                            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="total_presentes" 
                                            name="Presentes"
                                            stroke="#3b82f6" 
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, strokeWidth: 0 }} 
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Justificativas */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-8 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-6">Status Justificativas</h3>
                                <div className="space-y-4">
                                    {frequenciaGeral.statusJustificativas.map((status, i) => (
                                        <div key={status.status} className="flex items-center justify-between p-4 bg-muted/5 rounded-2xl border border-border/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CORES[i % CORES.length] }} />
                                                <span className="text-xs font-bold uppercase tracking-wide text-foreground/80">{status.status}</span>
                                            </div>
                                            <span className="text-sm font-black">{status.total}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SEÇÃO: EQUIPES ── */}
                {abaAtiva === 'equipes' && equipesRelatorio && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[40px] p-8 shadow-sm overflow-hidden relative">
                             <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                                    <Network size={18} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest leading-none">Resumo de Grupos</h3>
                            </div>
                            <div className="divide-y divide-border/10">
                                {equipesRelatorio.grupos.map((grupo) => (
                                    <div key={grupo.id} className="py-4 flex justify-between items-center group">
                                        <div>
                                            <p className="text-[13px] font-bold text-foreground mb-0.5">{grupo.nome}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Lider: {grupo.lider_nome || 'N/A'}</p>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="text-right">
                                                <p className="text-xs font-black text-foreground">{grupo.total_membros}</p>
                                                <p className="text-[9px] uppercase font-bold text-muted-foreground/40">Membros</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-primary">{grupo.total_equipes}</p>
                                                <p className="text-[9px] uppercase font-bold text-muted-foreground/40">Equipes</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[40px] p-8 shadow-sm overflow-hidden relative">
                             <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                                    <Users size={18} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest leading-none">Resumo de Equipes</h3>
                            </div>
                            <div className="divide-y divide-border/10">
                                {equipesRelatorio.equipes.map((equipe) => (
                                    <div key={equipe.id} className="py-4 flex justify-between items-center group">
                                        <div>
                                            <p className="text-[13px] font-bold text-foreground mb-0.5">{equipe.nome}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{equipe.grupo_nome} • {equipe.lider_nome || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-foreground">{equipe.total_membros}</p>
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground/40">Membros</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SEÇÃO: MEMBROS ── */}
                {abaAtiva === 'membros' && frequenciaMembros && (
                    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[40px] p-8 shadow-sm overflow-hidden space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Análise de Frequência Individual</h3>
                            <div className="relative w-full md:w-80">
                                <BarraBusca 
                                    valor={busca}
                                    aoMudar={setBusca}
                                    placeholder="Buscar membro..."
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/30">
                                        <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Membro</th>
                                        <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Alocação</th>
                                        <th className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Dias Presentes</th>
                                        <th className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Justificativas</th>
                                        <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Última Atividade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {membrosFiltrados.map((m: RelatorioFrequenciaMembro) => (
                                        <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[11px] font-black text-primary shrink-0">
                                                        {m.nome.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-bold text-foreground truncate max-w-[160px]">{m.nome}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[160px]">{m.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-black uppercase text-primary/60">{m.equipe_nome || 'Sem Equipe'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase truncate max-w-[150px]">{m.grupo_nome || 'Sem Grupo'}</p>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-lg text-xs font-black text-primary">
                                                    {m.dias_presentes}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className={`px-3 py-1 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs font-black ${m.justificativas_aprovadas > 3 ? 'text-red-400' : 'text-amber-500'}`}>
                                                    {m.justificativas_aprovadas}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-right">
                                                <p className="text-xs font-bold text-foreground/70">
                                                    {m.ultima_batida ? formatarDataHora(m.ultima_batida) : 'Nenhum registro'}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                </>
            )}
        </div>
    );
}
